/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/common-utils";
import { RevisionTag, TaggedChange } from "../../core";
import { fail } from "../../util";
import {
	ChangeAtomId,
	CrossFieldManager,
	CrossFieldTarget,
	IdAllocator,
	NodeReviver,
} from "../modular-schema";
import { Changeset, Mark, MarkList, Modify, ReturnFrom, NoopMarkType, MoveOut } from "./format";
import { MarkListFactory } from "./markListFactory";
import {
	areInputCellsEmpty,
	getInputLength,
	isConflictedReattach,
	isReattachConflicted,
	splitMark,
	withNodeChange,
} from "./utils";

export type NodeChangeInverter<TNodeChange> = (
	change: TNodeChange,
	index: number | undefined,
) => TNodeChange;

/**
 * Inverts a given changeset.
 * @param change - The changeset to produce the inverse of.
 * @returns The inverse of the given `change` such that the inverse can be applied after `change`.
 *
 * WARNING! This implementation is incomplete:
 * - Support for slices is not implemented.
 */
export function invert<TNodeChange>(
	change: TaggedChange<Changeset<TNodeChange>>,
	invertChild: NodeChangeInverter<TNodeChange>,
	reviver: NodeReviver,
	genId: IdAllocator,
	crossFieldManager: CrossFieldManager,
): Changeset<TNodeChange> {
	return invertMarkList(
		change.change,
		change.revision,
		reviver,
		invertChild,
		crossFieldManager as CrossFieldManager<TNodeChange>,
	);
}

export function amendInvert<TNodeChange>(
	invertedChange: Changeset<TNodeChange>,
	originalRevision: RevisionTag | undefined,
	reviver: NodeReviver,
	genId: IdAllocator,
	crossFieldManager: CrossFieldManager,
): Changeset<TNodeChange> {
	return amendMarkList(
		invertedChange,
		originalRevision,
		crossFieldManager as CrossFieldManager<TNodeChange>,
	);
}

function invertMarkList<TNodeChange>(
	markList: MarkList<TNodeChange>,
	revision: RevisionTag | undefined,
	reviver: NodeReviver,
	invertChild: NodeChangeInverter<TNodeChange>,
	crossFieldManager: CrossFieldManager<TNodeChange>,
): MarkList<TNodeChange> {
	const inverseMarkList = new MarkListFactory<TNodeChange>();
	let inputIndex = 0;

	for (const mark of markList) {
		const inverseMarks = invertMark(
			mark,
			inputIndex,
			revision,
			reviver,
			invertChild,
			crossFieldManager,
		);
		inverseMarkList.push(...inverseMarks);
		inputIndex += getInputLength(mark);
	}

	return inverseMarkList.list;
}

function invertMark<TNodeChange>(
	mark: Mark<TNodeChange>,
	inputIndex: number,
	revision: RevisionTag | undefined,
	reviver: NodeReviver,
	invertChild: NodeChangeInverter<TNodeChange>,
	crossFieldManager: CrossFieldManager<TNodeChange>,
): Mark<TNodeChange>[] {
	switch (mark.type) {
		case NoopMarkType: {
			return [mark];
		}
		case "Insert": {
			const inverse = withNodeChange(
				{ type: "Delete", count: mark.content.length, id: mark.id },
				invertNodeChange(mark.changes, inputIndex, invertChild),
			);
			return [inverse];
		}
		case "Delete": {
			assert(revision !== undefined, 0x5a1 /* Unable to revert to undefined revision */);
			if (mark.detachEvent === undefined) {
				const inverse = withNodeChange(
					{
						type: "Revive",
						detachEvent: mark.detachIdOverride ?? {
							revision: mark.revision ?? revision,
							localId: mark.id,
						},
						content: reviver(revision, inputIndex, mark.count),
						count: mark.count,
						inverseOf: mark.revision ?? revision,
					},
					invertNodeChange(mark.changes, inputIndex, invertChild),
				);

				return [inverse];
			}
			// TODO: preserve modifications to the removed nodes.
			return [];
		}
		case "Revive": {
			if (!isReattachConflicted(mark)) {
				assert(
					mark.detachEvent !== undefined,
					"Active reattach should have a detach event",
				);
				const inverse = withNodeChange(
					{
						type: "Delete",
						count: mark.count,
						id: mark.detachEvent.localId,
						detachIdOverride: mark.detachEvent,
					},
					invertNodeChange(mark.changes, inputIndex, invertChild),
				);
				return [inverse];
			}
			return [
				invertModifyOrSkip(
					mark.count,
					mark.changes,
					inputIndex,
					invertChild,
					mark.detachEvent,
				),
			];
		}
		case "Modify": {
			if (mark.detachEvent === undefined) {
				return [
					{
						type: "Modify",
						changes: invertChild(mark.changes, inputIndex),
					},
				];
			}
			// TODO: preserve modifications to the removed nodes.
			return [];
		}
		case "MoveOut":
		case "ReturnFrom": {
			if (areInputCellsEmpty(mark)) {
				// TODO: preserve modifications to the removed nodes.
				return [];
			}
			if (mark.type === "ReturnFrom" && mark.isDstConflicted) {
				// The nodes were present but the destination was conflicted, the mark had no effect on the nodes.
				return [invertModifyOrSkip(mark.count, mark.changes, inputIndex, invertChild)];
			}
			if (mark.changes !== undefined) {
				assert(
					mark.count === 1,
					0x6ed /* Mark with changes can only target a single cell */,
				);
				crossFieldManager.set(
					CrossFieldTarget.Destination,
					mark.revision ?? revision,
					mark.id,
					mark.count,
					invertChild(mark.changes, inputIndex),
					true,
				);
			}
			const detachEvent =
				mark.type === "ReturnFrom" && mark.detachIdOverride !== undefined
					? mark.detachIdOverride
					: {
							revision: mark.revision ?? revision ?? fail("Revision must be defined"),
							localId: mark.id,
					  };

			return [
				{
					type: "ReturnTo",
					id: mark.id,
					count: mark.count,
					detachEvent,
				},
			];
		}
		case "MoveIn": {
			if (mark.isSrcConflicted) {
				return [];
			}

			const invertedMark: ReturnFrom<TNodeChange> = {
				type: "ReturnFrom",
				id: mark.id,
				count: mark.count,
			};

			return applyMovedChanges(invertedMark, revision, crossFieldManager);
		}
		case "ReturnTo": {
			if (mark.isSrcConflicted) {
				return mark.detachEvent === undefined ? [{ count: mark.count }] : [];
			}

			if (mark.detachEvent === undefined) {
				// The nodes were already attached, so the mark did not affect them.
				return [{ count: mark.count }];
			} else if (isConflictedReattach(mark)) {
				// The nodes were not attached and could not be attached.
				return [];
			}

			const invertedMark: ReturnFrom<TNodeChange> = {
				type: "ReturnFrom",
				id: mark.id,
				detachIdOverride: mark.detachEvent,
				count: mark.count,
			};

			return applyMovedChanges(invertedMark, revision, crossFieldManager);
		}
		default:
			fail("Not implemented");
	}
}

function amendMarkList<TNodeChange>(
	marks: MarkList<TNodeChange>,
	revision: RevisionTag | undefined,
	crossFieldManager: CrossFieldManager<TNodeChange>,
): MarkList<TNodeChange> {
	const factory = new MarkListFactory<TNodeChange>();

	for (const mark of marks) {
		if (mark.type === "MoveOut" || mark.type === "ReturnFrom") {
			factory.push(...applyMovedChanges(mark, revision, crossFieldManager));
		} else {
			factory.push(mark);
		}
	}

	return factory.list;
}

function applyMovedChanges<TNodeChange>(
	mark: MoveOut<TNodeChange> | ReturnFrom<TNodeChange>,
	revision: RevisionTag | undefined,
	manager: CrossFieldManager<TNodeChange>,
): Mark<TNodeChange>[] {
	// Although this is a source mark, we query the destination because this was a destination mark during the original invert pass.
	const entry = manager.get(
		CrossFieldTarget.Destination,
		mark.revision ?? revision,
		mark.id,
		mark.count,
		true,
	);
	if (entry === undefined) {
		return [mark];
	}

	if (entry.start > mark.id) {
		// The entry does not apply to the first cell in the mark.
		const [mark1, mark2] = splitMark(mark, entry.start - mark.id);
		return [mark1, ...applyMovedChanges(mark2, revision, manager)];
	} else if (entry.start + entry.length < (mark.id as number) + mark.count) {
		// The entry applies to the first cell in the mark, but not the mark's entire range.
		const [mark1, mark2] = splitMark(mark, entry.start + entry.length - mark.id);
		return [withNodeChange(mark1, entry.value), ...applyMovedChanges(mark2, revision, manager)];
	} else {
		// The entry applies to all cells in the mark.
		return [withNodeChange(mark, entry.value)];
	}
}

function invertModifyOrSkip<TNodeChange>(
	length: number,
	changes: TNodeChange | undefined,
	index: number,
	inverter: NodeChangeInverter<TNodeChange>,
	detachEvent?: ChangeAtomId,
): Mark<TNodeChange> {
	if (changes !== undefined) {
		assert(length === 1, 0x66c /* A modify mark must have length equal to one */);
		const modify: Modify<TNodeChange> = { type: "Modify", changes: inverter(changes, index) };
		if (detachEvent !== undefined) {
			modify.detachEvent = detachEvent;
		}
		return modify;
	}

	return { count: detachEvent === undefined ? length : 0 };
}

function invertNodeChange<TNodeChange>(
	change: TNodeChange | undefined,
	index: number,
	inverter: NodeChangeInverter<TNodeChange>,
): TNodeChange | undefined {
	return change === undefined ? undefined : inverter(change, index);
}
