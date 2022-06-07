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

type MoveTracker = undefined;

function rebaseOverFrame(
	orig: R.ChangeFrame,
	base: R.ChangeFrame,
	baseSeq: SeqNumber,
): void {
    const moveTracker = undefined;
    rebaseNodeMarks(orig.marks, base.marks, baseSeq, moveTracker);
    handleMoveIns(orig.marks, base.marks, moveTracker);
}

function handleMoveIns(
    orig: R.NodeMarks,
    base: R.NodeMarks,
    moveTracker: MoveTracker,
): void {
}

function rebaseNodeMarks(
    orig: R.NodeMarks,
    base: R.NodeMarks,
    baseSeq: SeqNumber,
    moveTracker: MoveTracker,
): void {
    for (const trait of Object.keys(orig)) {
        rebaseTraitMarks(orig[trait], base[trait] ?? [], baseSeq, moveTracker);
    }
}

function rebaseTraitMarks(
	curr: R.TraitMarks,
	base: R.TraitMarks,
    baseSeq: SeqNumber,
    moveTracker: MoveTracker,
): void {
    const currIterator = getIterator(curr);
    const baseIterator = getIterator(base);
    let sizeChange = 0;

    // TODO: Consider multiple active ranges
    let activeRangeOp: R.Mark | undefined;
    let rangeStart;
    let prevBaseMarkWithIndex;

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
            rebaseNodeMarks(currMark.modify, baseMark.modify, baseSeq, moveTracker);
        }
        if (cmp <= 0) {
            if (rangeStart !== undefined) {
                const offsetIntoRange = currMarkWithIndex.index - rangeStart;
                sizeChange -= offsetIntoRange;
                rangeStart = currMarkWithIndex.index;
                addToLineage(currMark, baseSeq, (activeRangeOp as R.Place).op, offsetIntoRange);
            } else if (
                prevBaseMarkWithIndex?.index === currMarkWithIndex.index &&
                prevBaseMarkWithIndex.mark?.type === "End"
            ) {
                addToLineage(currMark, baseSeq, prevBaseMarkWithIndex.mark.op, Infinity);
            } else if (baseMarkWithIndex.index === currMarkWithIndex.index && baseMark.type === "End") {
                addToLineage(currMark, baseSeq, baseMark.op, 0);
            }
            adjustOffsetAndAdvance(currIterator, sizeChange);
            sizeChange = 0;
        }
        if (cmp >= 0) {
            switch (baseMark.type) {
                case "Insert":
                    sizeChange += baseMark.content.length;
                    break;

                case "MoveIn":
                    sizeChange += getLength(baseMark);
                    break;

                case "DeleteStart":
                    activeRangeOp = baseMark;
                    if (rangeStart === undefined) {
                        rangeStart = baseMarkWithIndex.index;
                    }
                    break;

                case "End":
                    assert(rangeStart !== undefined, "Range start should be set when encountering a range end");
                    sizeChange -= baseMarkWithIndex.index - rangeStart;
                    activeRangeOp = undefined;
                    rangeStart = undefined;
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

function adjustOffsetAndAdvance(iterator: TraitMarksIterator, delta: number): void {
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

    advanceI(iterator, prevOffset);
}

function getSideWithPriority(mark: R.Mark, isBase: boolean): number {
    switch (mark.type) {
        case "Insert":
        case "MoveIn":
            if (isBase) {
                return 0;
            }
            return getSide(mark) === Sibling.Prev ? -1 : 1;

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
