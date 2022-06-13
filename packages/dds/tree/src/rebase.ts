/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/common-utils";
import {
	Sequenced as S,
	Rebased as R,
    HasLength,
    Index,
    Lineage,
    Offset,
    OpId,
	SeqNumber,
    Sibling,
    Commutativity,
} from "./format";
import {
	clone,
} from "./utils";

export function rebase(original: R.Transaction, base: S.Transaction): R.Transaction {
    return {
        ...original,
		newRef: base.seq,
		frames: original.frames.map((frame) => rebaseFrame(frame, original, base)),
	};
}

function rebaseFrame(
	frame: R.TransactionFrame,
	original: R.Transaction,
	base: S.Transaction,
): R.TransactionFrame {
	// TODO: account for constraint frames
	return rebaseChangeFrame(frame as R.ChangeFrame, original, base);
}

function rebaseChangeFrame(
	frameToRebase: R.ChangeFrame,
	originalTransaction: R.Transaction,
	baseTransaction: S.Transaction,
): R.ChangeFrame {
	const baseSeq = baseTransaction.seq;
	const newFrame: R.ChangeFrame = clone(frameToRebase);
	for (const baseFrame of baseTransaction.frames) {
		rebaseOverFrame(newFrame, baseFrame as R.ChangeFrame, baseSeq);
	}
	return newFrame;
}

interface RebaseState {
    numMarks: number;
    movedMarks: MoveTable;
}

type MoveTable = Map<OpId, R.Mark[]>;

function rebaseOverFrame(
	orig: R.ChangeFrame,
	base: R.ChangeFrame,
	baseSeq: SeqNumber,
): void {
    const state = { numMarks: countNodeOps(orig.marks), movedMarks: new Map() };
    rebaseNodeMarks(orig.marks, base.marks, baseSeq, state);
    handleMoveIns(orig.marks, base.marks, state.movedMarks);
}

function rebaseNodeMarks(
    orig: R.NodeMarks,
    base: R.NodeMarks,
    baseSeq: SeqNumber,
    state: RebaseState,
): void {
    for (const trait of Object.keys(orig)) {
        rebaseTraitMarks(orig[trait], base[trait] ?? [], baseSeq, state);
    }
}

// TODO: Should return whether there are any marks remaining in the trait so we can purge empty traits
function rebaseTraitMarks(
	curr: R.TraitMarks,
	base: R.TraitMarks,
    baseSeq: SeqNumber,
    state: RebaseState,
): void {
    const currIterator = getIterator(curr);
    const baseIterator = getIterator(base);
    let sizeChange = 0;

    // TODO: Consider multiple active ranges
    let activeBaseRangeOp: R.RangeStart | undefined;
    let baseRangeStart;
    let prevBaseMarkWithIndex;
    let activeCurrRangeOp: R.RangeStart | undefined;
    let currRangeStart;

    while (isValid(currIterator) && isValid(baseIterator)) {
        const currMarkWithIndex = getMark(currIterator);
        const baseMarkWithIndex = getMark(baseIterator);
        const cmp = compareMarkPositions(currMarkWithIndex, baseMarkWithIndex);

        const currMark = currMarkWithIndex.mark;
        const baseMark = baseMarkWithIndex.mark;

        if (cmp === 0) {
            assert(
                currMark.type === "Modify" && baseMark.type === "Modify",
                "Only modifies should be at identical positions",
            );
            rebaseNodeMarks(currMark.modify, baseMark.modify, baseSeq, state);
        }
        if (cmp <= 0) {
            let shouldAdvance = true;
            if (baseRangeStart !== undefined) {
                // TODO: Check if this change should be marked inactive
                const offsetIntoRange = currMarkWithIndex.index - baseRangeStart;

                assert(activeBaseRangeOp !== undefined, "");
                if (activeBaseRangeOp.type === "MoveOutStart" && followsMoves(currMark)) {
                    appendToMap(state.movedMarks, activeBaseRangeOp.op, currMark);
                    removeMark(currIterator);
                    shouldAdvance = false;
                } else {
                    sizeChange -= offsetIntoRange;
                    baseRangeStart = currMarkWithIndex.index;
                    addToLineage(currMark, baseSeq, (activeBaseRangeOp as R.Place).op, offsetIntoRange);
                }
            } else if (
                prevBaseMarkWithIndex?.index === currMarkWithIndex.index &&
                prevBaseMarkWithIndex.mark?.type === "End"
            ) {
                addToLineage(currMark, baseSeq, prevBaseMarkWithIndex.mark.op, Infinity);
            } else if (baseMarkWithIndex.index === currMarkWithIndex.index && baseMark.type === "End") {
                addToLineage(currMark, baseSeq, baseMark.op, 0);
            }
            switch (currMark.type) {
                case "DeleteStart":
                case "MoveOutStart":
                    activeCurrRangeOp = currMark;
                    currRangeStart = currMarkWithIndex.index;
                    break;
                case "End":
                    activeCurrRangeOp = undefined;
                    currRangeStart = undefined;
                default:
                    break;
            }

            if (shouldAdvance) {
                adjustOffsetAndAdvance(currIterator, sizeChange);
                sizeChange = 0;
            }
        }
        if (cmp >= 0) {
            switch (baseMark.type) {
                case "Insert":
                case "MoveIn": {
                    const size = getSize(baseMark);
                    if (activeCurrRangeOp !== undefined) {
                        // TODO: Compute this correctly
                        const isRemovedByRange = false;
                        if (isRemovedByRange) {
                            break;
                        }

                        assert(currRangeStart !== undefined, "Range start should be set if there is an active range");
                        const offset = baseMarkWithIndex.index - currRangeStart;
                        splitRange(currIterator, activeCurrRangeOp, offset + sizeChange, size, state.numMarks);
                        state.numMarks++;
                        activeCurrRangeOp = undefined;
                        currRangeStart = undefined;
                        sizeChange = 0;
                    } else {
                        sizeChange += size;
                    }
                    break;
                }
                case "DeleteStart":
                case "MoveOutStart":
                    activeBaseRangeOp = baseMark;
                    if (baseRangeStart === undefined) {
                        baseRangeStart = baseMarkWithIndex.index;
                    }
                    break;

                case "End":
                    assert(baseRangeStart !== undefined, "Range start should be set when encountering a range end");
                    sizeChange -= baseMarkWithIndex.index - baseRangeStart;
                    activeBaseRangeOp = undefined;
                    baseRangeStart = undefined;
                    break;

                default:
                    break;
            }

            prevBaseMarkWithIndex = baseMarkWithIndex;
            advance(baseIterator);
        }
    }

    if (isValid(currIterator)) {
        // TODO: Deduplicate this logic
        const currMarkWithIndex = getMark(currIterator);
        if (prevBaseMarkWithIndex?.index === currMarkWithIndex.index && prevBaseMarkWithIndex.mark?.type === "End") {
            addToLineage(currMarkWithIndex.mark, baseSeq, prevBaseMarkWithIndex.mark.op, Infinity);
        }
        adjustOffsetAndAdvance(currIterator, sizeChange);
    }
}

function handleMoveIns(
    orig: R.NodeMarks,
    base: R.NodeMarks,
    movedMarks: MoveTable,
): void {
    for (const trait of Object.keys(base)) {
        const newMarks: R.TraitMarks = [];
        handleTraitMoveIns(orig[trait] ?? newMarks, base[trait], movedMarks);
        if (newMarks.length > 0) {
            Object.defineProperty(orig, trait, newMarks);
        }
    }
}

function handleTraitMoveIns(
    orig: R.TraitMarks,
    base: R.TraitMarks,
    movedMarks: MoveTable,
): void {
    // Walk both, handle move ins if necessary, potentially add new modify when recursing
}

function appendToMap<K, V>(map: Map<K, V[]>, key: K, val: V) {
    if (!map.has(key)) {
        map.set(key, []);
    }
    (map.get(key) as V[]).push(val);
}

function countNodeOps(marks: R.NodeMarks): number {
    return Object.values(marks).reduce(
        (sum, trait) => sum + countTraitOps(trait),
        0,
    );
}

function countTraitOps(marks: R.TraitMarks): number {
    return marks.reduce(
        (sum: number, mark) => sum + countOps(mark),
        0,
    );
}

function countOps(mark: R.Mark | Offset): number {
    if (R.isOffset(mark)) {
        return 0;
    }

    switch ((mark as R.Mark).type) {
        case "Modify":
            return countNodeOps((mark as R.Modify).modify);
        case "End":
            return 0;
        default:
            return 1;
    }
}

// TODO: This implementation probably doesn't work correctly for ops nested in the rage.
function splitRange(
    iterator: TraitMarksIterator,
    startOp: R.RangeStart,
    firstSegmentLength: number,
    skippedLength: number,
    newOpId: OpId,
) {
    const endMark: R.RangeEnd = { type: "End", op: newOpId };
    const startMark = { ...startOp };
    const isSlice = false;
    if (isSlice) {
        endMark.side = Sibling.Next;
        startMark.side = Sibling.Prev;
    }

    adjustOffset(iterator, -firstSegmentLength);
    insertMark(iterator, firstSegmentLength, endMark);
    advance(iterator);
    insertMark(iterator, skippedLength, startMark);
    startOp.op = newOpId;
}

interface MarkWithIndex {
    mark: R.Mark;
    index: Index;
}

function compareMarkPositions(currMark: MarkWithIndex, baseMark: MarkWithIndex): number {
    const cmpIndex = currMark.index - baseMark.index;
    if (cmpIndex !== 0) {
        return cmpIndex;
    }

    const cmpLineage = compareLineagePositions(getLineage(currMark.mark), getLineage(baseMark.mark));
    if (cmpLineage !== 0) {
        return cmpLineage;
    }

    const baseSide = getSideWithPriority(baseMark.mark, true);
    const currSide = getSideWithPriority(currMark.mark, false);
    return currSide - baseSide;
}

function compareLineagePositions(lineageA: Lineage, lineageB: Lineage): number {
    const commonAncestorIndices = getCommonAncestorIndices(lineageA, lineageB);
    if (commonAncestorIndices === undefined) {
        return 0;
    }

    let [indexA, indexB] = commonAncestorIndices;
    while (indexA >= 0 && indexB >= 0) {
        const nodeA = lineageA[indexA];
        const nodeB = lineageB[indexB];
        assert(
            nodeA.seq === nodeB.seq && nodeA.op === nodeB.op,
            "Ancestry should be the same when starting from common ancestor",
        );

        const cmp = nodeA.offset - nodeB.offset;
        if (cmp !== 0) {
            return cmp;
        }

        indexA--;
        indexB--;
    }

    return 0;
}

function getCommonAncestorIndices(lineageA: Lineage, lineageB: Lineage): [number, number] | undefined {
    for (let indexA = lineageA.length - 1; indexA >= 0; indexA--) {
        const seq = lineageA[indexA].seq;
        const op = lineageA[indexA].op;
        const indexB = lineageB.findIndex((nodeB) => nodeB.seq === seq && nodeB.op === op);
        if (indexB >= 0) {
            return [indexA, indexB];
        }
    }
    return undefined;
}

function getLineage(mark: R.Mark): Lineage {
    switch (mark.type) {
        case "Insert":
        case "MoveIn":
        case "MoveOutStart":
        case "DeleteStart":
        case "End":
            return mark.lineage ?? [];
        default:
            return [];
    }
}

interface TraitMarksIterator {
    marks: R.TraitMarks;
    markIndex: number;
    traitIndex: Index;
}

function getIterator(marks: R.TraitMarks): TraitMarksIterator {
    return { marks, markIndex: 0, traitIndex: 0 };
}

function hasOffset(iterator: TraitMarksIterator): boolean {
    return R.isOffset(iterator.marks[iterator.markIndex]);
}

function isValid(iterator: TraitMarksIterator): boolean {
    return iterator.markIndex < iterator.marks.length;
}

function getMark(iterator: TraitMarksIterator): MarkWithIndex {
    const offset = getNextOffset(iterator);
    const markIndex = hasOffset(iterator) ? iterator.markIndex + 1 : iterator.markIndex;
    return {
        mark: iterator.marks[markIndex] as R.Mark,
        index: iterator.traitIndex + offset,
    };
}

function getNextOffset(iterator: TraitMarksIterator): Offset {
    return hasOffset(iterator) ? iterator.marks[iterator.markIndex] as Offset : 0;
}

function advance(iterator: TraitMarksIterator): void {
    advanceI(iterator, getNextOffset(iterator));
}

function advanceI(iterator: TraitMarksIterator, offset: Offset): void {
    iterator.traitIndex += offset;
    const markLength = hasOffset(iterator) ? 2 : 1;
    iterator.markIndex += markLength;
}

// Returns the offset before the adjustment
function adjustOffset(iterator: TraitMarksIterator, delta: number): number {
    let prevOffset = 0;
    if (hasOffset(iterator)) {
        prevOffset = iterator.marks[iterator.markIndex] as number;
        const newOffset = prevOffset + delta;
        if (newOffset === 0) {
            iterator.marks.splice(iterator.markIndex, 1);
        } else {
            iterator.marks[iterator.markIndex] = newOffset;
        }
    } else if (delta !== 0) {
        assert(delta > 0, "Negative distance between marks");
        iterator.marks.splice(iterator.markIndex, 0, delta);
    }

    return prevOffset;
}

function adjustOffsetAndAdvance(iterator: TraitMarksIterator, delta: number): void {
    const prevOffset = adjustOffset(iterator, delta);
    advanceI(iterator, prevOffset);
}

function insertMark(iterator: TraitMarksIterator, offset: Offset, mark: R.Mark) {
    iterator.marks.splice(iterator.markIndex, 0, offset, mark);
}

function removeMark(iterator: TraitMarksIterator) {
    const offset = getNextOffset(iterator);
    iterator.marks.splice(iterator.markIndex, offset === 0 ? 1 : 2);

    if (isValid(iterator)) {
        // Merge the offset before the removed mark into the next offset
        adjustOffset(iterator, offset);
    }
}

function getSideWithPriority(mark: R.Mark, isBase: boolean): number {
    switch (mark.type) {
        case "Insert":
        case "MoveIn":
            if (isBase) {
                return 0;
            }
            return getSide(mark) === Sibling.Prev ? -1 : 1;

        // TODO: What should order be when both marks are ranges with same side preference?
        case "MoveOutStart":
        case "DeleteStart":
        case "End":
            return getSide(mark) === Sibling.Prev ? -2 : 2;

        case "Modify":
            return 3;

        default:
            assert(false, "All cases should be covered");
    }
}

function getSide(mark: R.Place): Sibling {
    return mark.side ?? Sibling.Prev;
}

function followsMoves(mark: R.Mark): boolean {
    switch (mark.type) {
        case "Insert":
        case "MoveIn":
            return (mark.commute ?? Commutativity.Full) !== Commutativity.None;
        default:
            return false;
    }
}

function getSize(mark: R.AttachMark): number {
    if (mark.type === "Insert") {
        return mark.content.length;
    }

    return getLength(mark);
}

function getLength(mark: HasLength): number {
    return mark.length ?? 1;
}

function addToLineage(mark: R.Mark, seq: SeqNumber, op: OpId, offset: Offset): void {
    switch (mark.type) {
        case "Insert":
        case "MoveIn":
        case "MoveOutStart":
        case "DeleteStart":
        case "End":
            if (mark.lineage === undefined) {
                mark.lineage = [];
            }
            mark.lineage.push({ seq, op, offset });
        default:
            break;
    }
}
