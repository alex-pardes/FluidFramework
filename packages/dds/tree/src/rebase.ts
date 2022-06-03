/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Sequenced as S,
	Rebased as R,
    HasLength,
    Index,
    Offset,
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
    for (const trait of Object.keys(orig.marks)) {
        rebaseMarks(orig.marks[trait], base.marks[trait] ?? []);
    }
}

// TODO: Build better interface for TraitMarks
// Probably iterator of type OffsetMark = { mark, offset}

function rebaseMarks(
	curr: R.TraitMarks,
	base: R.TraitMarks,
): void {
    const currIterator = getIterator(curr);
    const baseIterator = getIterator(base);
    let sizeChange = 0;

    while (isValid(currIterator) && isValid(baseIterator)) {
        const currMark = getMark(currIterator);
        const baseMark = getMark(baseIterator);
        const cmp = compare(currMark, baseMark);
        if (cmp < 0) {
            adjustOffset(currIterator, sizeChange);
            sizeChange = 0;
            advance(currIterator);
        } else if (cmp > 0) {
            sizeChange += getSizeChange(baseMark.mark);
            advance(baseIterator);
        } else {
            advance(currIterator);
            adjustOffset(currIterator, sizeChange);
            sizeChange = 0;

            // This case should only happen when both marks are `Modify`, so baseMark should have no size change.
            advance(baseIterator);
        }
    }
}

interface MarkWithIndex {
    mark: R.Mark;
    index: Index;
}

function compare(newerMark: MarkWithIndex, olderMark: MarkWithIndex): number {
    const cmp = newerMark.index - olderMark.index;
    if (cmp !== 0) {
        return cmp;
    }

    const side = getSide(newerMark.mark);
    switch (side) {
        case Sibling.Prev:
            return -1;
        case Sibling.Next:
            return 1;
        default:
            return 0;
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

function advance(iterator: TraitMarksIterator) {
    iterator.traitIndex += getNextOffset(iterator);
    const markLength = hasOffset(iterator) ? 2 : 1;
    iterator.markIndex += markLength;
}

function adjustOffset(iterator: TraitMarksIterator, delta: number) {
    if (hasOffset(iterator)) {
        const newOffset = iterator.marks[iterator.markIndex] as number + delta;
        if (newOffset === 0) {
            iterator.marks.splice(iterator.markIndex, 1);
        } else {
            iterator.marks[iterator.markIndex] = newOffset;
        }
    } else if (delta > 0) {
        iterator.marks.splice(iterator.markIndex, 0, delta);
    }
}

function getSizeChange(mark: R.Mark): number {
    // TODO: Handle return and revive
    switch (mark.type) {
        case "Insert":
            return mark.content.length;
        case "MoveInSet":
        case "MoveInSlice":
            return getLength(mark);
        case "Delete":
        case "MoveOut":
            return -getLength(mark);
        default:
            return 0;
    }
}

function getSide(mark: R.Mark): Sibling | undefined {
    // TODO: Range starts
    switch (mark.type) {
        case "Insert":
        case "MoveInSet":
        case "MoveInSlice":
        case "MoveOutStart":
        case "DeleteStart":
        case "End":
            return mark.side ?? Sibling.Prev;
        default:
            return undefined;
    }
}

function getLength(mark: HasLength): number {
    return mark.length ?? 1;
}
