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

function rebaseOverFrame(
	orig: R.ChangeFrame,
	base: R.ChangeFrame,
	baseSeq: SeqNumber,
): void {
    rebaseNodeMarks(orig.marks, base.marks);
}

function rebaseNodeMarks(
    orig: R.NodeMarks,
    base: R.NodeMarks,
): void {
    for (const trait of Object.keys(orig)) {
        rebaseTraitMarks(orig[trait], base[trait] ?? []);
    }
}

function rebaseTraitMarks(
	curr: R.TraitMarks,
	base: R.TraitMarks,
): void {
    const currIterator = getIterator(curr);
    const baseIterator = getIterator(base);
    let sizeChange = 0;
    const activeRangeOps = new Map<OpId, R.Mark>();
    let rangeStart;

    while (isValid(currIterator) && isValid(baseIterator)) {
        const currMarkWithIndex = getMark(currIterator);
        const baseMarkWithIndex = getMark(baseIterator);
        const cmp = compare(currMarkWithIndex, baseMarkWithIndex);

        const currMark = currMarkWithIndex.mark;
        const baseMark = baseMarkWithIndex.mark;

        if (cmp === 0) {
            assert(
                currMark.type === "Modify" && baseMark.type === "Modify",
                "Only modifies should be at identical positions",
            );
            rebaseNodeMarks(currMark.modify, baseMark.modify);
        }
        if (cmp <= 0) {
            if (rangeStart !== undefined) {
                sizeChange -= currMarkWithIndex.index - rangeStart;
                rangeStart = currMarkWithIndex.index;
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
                    activeRangeOps.set(baseMark.op, baseMark);
                    if (rangeStart === undefined) {
                        rangeStart = baseMarkWithIndex.index;
                    }
                    break;

                case "End":
                    activeRangeOps.delete(baseMark.op);
                    if (activeRangeOps.size === 0) {
                        assert(rangeStart !== undefined, "Range start should be set when encountering a range end");
                        sizeChange -= baseMarkWithIndex.index - rangeStart;
                        rangeStart = undefined;
                    }
                    break;

                default: {}
            }

            advance(baseIterator);
        }
    }

    if (isValid(currIterator)) {
        adjustOffsetAndAdvance(currIterator, sizeChange);
    }
}

interface MarkWithIndex {
    mark: R.Mark;
    index: Index;
}

function compare(currMark: MarkWithIndex, baseMark: MarkWithIndex): number {
    const cmp = currMark.index - baseMark.index;
    if (cmp !== 0) {
        return cmp;
    }

    const baseSide = getSideWithPriority(baseMark.mark, true);
    const currSide = getSideWithPriority(currMark.mark, false);
    return currSide - baseSide;
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

function advance(iterator: TraitMarksIterator) {
    advanceI(iterator, getNextOffset(iterator));
}

function advanceI(iterator: TraitMarksIterator, offset: Offset) {
    iterator.traitIndex += offset;
    const markLength = hasOffset(iterator) ? 2 : 1;
    iterator.markIndex += markLength;
}

function adjustOffsetAndAdvance(iterator: TraitMarksIterator, delta: number) {
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
