/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils";
import {
	TaggedChange,
	ChangesetLocalId,
	RevisionTag,
	DeltaFieldChanges,
	DeltaDetachedNodeRename,
	DeltaMark,
	DeltaDetachedNodeId,
	DeltaDetachedNodeChanges,
	ChangeAtomId,
	areEqualChangeAtomIds,
	ChangeAtomIdMap,
	makeChangeAtomId,
	tagChange,
} from "../../core/index.js";
import {
	Mutable,
	IdAllocator,
	SizedNestedMap,
	setInNestedMap,
	tryGetFromNestedMap,
	deleteFromNestedMap,
} from "../../util/index.js";
import {
	ToDelta,
	FieldChangeRebaser,
	NodeChangeComposer,
	NodeChangeInverter,
	NodeChangeRebaser,
	NodeChangeset,
	FieldEditor,
	NodeExistenceState,
	FieldChangeHandler,
	RelevantRemovedRootsFromChild,
	NodeChangePruner,
} from "../modular-schema/index.js";
import { nodeIdFromChangeAtom } from "../deltaUtils.js";
import {
	RegisterId,
	OptionalChangeset,
	Move,
	ChildChange,
	Replace,
} from "./optionalFieldChangeTypes.js";
import { makeOptionalFieldCodecFamily } from "./optionalFieldCodecs.js";

export interface IRegisterMap<T> {
	set(id: RegisterId, childChange: T): void;
	get(id: RegisterId): T | undefined;
	delete(id: RegisterId): boolean;
	keys(): Iterable<RegisterId>;
	values(): Iterable<T>;
	entries(): Iterable<[RegisterId, T]>;
	readonly size: number;
}

export class RegisterMap<T> implements IRegisterMap<T> {
	private readonly nestedMapData = new SizedNestedMap<
		ChangesetLocalId | "self",
		RevisionTag | undefined,
		T
	>();

	public clone(): RegisterMap<T> {
		const clone = new RegisterMap<T>();
		for (const [id, t] of this.entries()) {
			clone.set(id, t);
		}
		return clone;
	}

	public set(id: RegisterId, childChange: T): void {
		if (id === "self") {
			this.nestedMapData.set("self", undefined, childChange);
		} else {
			this.nestedMapData.set(id.localId, id.revision, childChange);
		}
	}

	public get(id: RegisterId): T | undefined {
		return id === "self"
			? this.nestedMapData.tryGet(id, undefined)
			: this.nestedMapData.tryGet(id.localId, id.revision);
	}

	public has(id: RegisterId): boolean {
		return this.get(id) !== undefined;
	}

	public delete(id: RegisterId): boolean {
		return id === "self"
			? this.nestedMapData.delete("self", undefined)
			: this.nestedMapData.delete(id.localId, id.revision);
	}

	public keys(): Iterable<RegisterId> {
		const changeIds: RegisterId[] = [];
		for (const [localId, nestedMap] of this.nestedMapData) {
			if (localId === "self") {
				changeIds.push("self");
			} else {
				for (const [revisionTag, _] of nestedMap) {
					changeIds.push(
						revisionTag === undefined
							? { localId }
							: { localId, revision: revisionTag },
					);
				}
			}
		}

		return changeIds;
	}
	public values(): Iterable<T> {
		return this.nestedMapData.values();
	}
	public entries(): Iterable<[RegisterId, T]> {
		const entries: [RegisterId, T][] = [];
		for (const changeId of this.keys()) {
			if (changeId === "self") {
				const entry = this.nestedMapData.tryGet("self", undefined);
				assert(
					entry !== undefined,
					0x770 /* Entry should not be undefined when iterating keys. */,
				);
				entries.push(["self", entry]);
			} else {
				const entry = this.nestedMapData.tryGet(changeId.localId, changeId.revision);
				assert(
					entry !== undefined,
					0x771 /* Entry should not be undefined when iterating keys. */,
				);
				entries.push([changeId, entry]);
			}
		}

		return entries;
	}
	public get size(): number {
		return this.nestedMapData.size;
	}
}

export const optionalChangeRebaser: FieldChangeRebaser<OptionalChangeset> = {
	compose: (
		{ change: change1, revision: revision1 }: TaggedChange<OptionalChangeset>,
		{ change: change2, revision: revision2 }: TaggedChange<OptionalChangeset>,
		composeChild: NodeChangeComposer,
	): OptionalChangeset => {
		const { srcToDst, dstToSrc } = getBidirectionalMaps(change1.moves, revision1);
		const change1FieldSrc = taggedOptRegister(change1.field?.src, revision1);
		const change1FieldDst = taggedOptAtomId(change1.field?.dst, revision1);

		const childChanges2ByOriginalId = new RegisterMap<NodeChangeset>();
		for (const [id, change] of change2.childChanges) {
			if (id === "self") {
				if (change1FieldSrc !== undefined) {
					childChanges2ByOriginalId.set(change1FieldSrc, change);
				} else {
					childChanges2ByOriginalId.set("self", change);
				}
			} else {
				const idWithRevision = taggedAtomId(id, revision2);
				if (
					change1FieldDst !== undefined &&
					areEqualChangeAtomIds(change1FieldDst, idWithRevision)
				) {
					childChanges2ByOriginalId.set("self", change);
				} else {
					const originalId = tryGetFromNestedMap(
						dstToSrc,
						idWithRevision.revision,
						idWithRevision.localId,
					);
					childChanges2ByOriginalId.set(originalId ?? idWithRevision, change);
				}
			}
		}

		const composedMoves: Move[] = [];
		const composedChildChanges: ChildChange[] = [];
		const composed: Mutable<OptionalChangeset> = {
			moves: composedMoves,
			childChanges: composedChildChanges,
		};

		for (const [id, childChange1] of change1.childChanges) {
			const idWithRevision = taggedRegister(id, revision1);
			const childChange2 = childChanges2ByOriginalId.get(idWithRevision);
			composedChildChanges.push([idWithRevision, composeChild(childChange1, childChange2)]);
			childChanges2ByOriginalId.delete(idWithRevision);
		}

		for (const [id, childChange2] of childChanges2ByOriginalId.entries()) {
			composedChildChanges.push([id, composeChild(undefined, childChange2)]);
		}

		let composedFieldDst: ChangeAtomId | undefined;
		for (const [src, dst] of change2.moves) {
			const leg2Src = taggedAtomId(src, revision2);
			const leg2Dst = taggedAtomId(dst, revision2);
			const leg1Src = tryGetFromNestedMap(dstToSrc, leg2Src.revision, leg2Src.localId);
			if (leg1Src !== undefined) {
				composedMoves.push([leg1Src, leg2Dst]);
				deleteFromNestedMap(srcToDst, leg1Src.revision, leg1Src.localId);
				deleteFromNestedMap(dstToSrc, leg2Src.revision, leg2Src.localId);
			} else if (
				change1FieldDst !== undefined &&
				areEqualChangeAtomIds(change1FieldDst, leg2Src)
			) {
				composedFieldDst = leg2Dst;
			} else {
				composedMoves.push([leg2Src, leg2Dst]);
			}
		}

		for (const [revision, innerMap] of srcToDst.entries()) {
			for (const [localId, dst] of innerMap.entries()) {
				composedMoves.push([makeChangeAtomId(localId, revision), dst]);
			}
		}

		let composedFieldSrc: RegisterId | undefined = change1FieldSrc;
		if (
			change1FieldSrc !== undefined &&
			change1FieldSrc !== "self" &&
			change2.field !== undefined
		) {
			const change2FieldDst = taggedAtomId(change2.field.dst, revision2);
			if (areEqualChangeAtomIds(change1FieldSrc, change2FieldDst)) {
				// This can only occur when composing a change and its rollback inverse.
			} else {
				composedMoves.push([change1FieldSrc, change2FieldDst]);
			}
			composedFieldSrc = undefined;
		}

		const firstFieldReplace =
			tagChange(change1.field, revision1) ?? tagChange(change2.field, revision2);
		if (firstFieldReplace.change !== undefined) {
			const replace: Mutable<Replace> = {
				isEmpty: firstFieldReplace.change.isEmpty,
				dst:
					composedFieldDst ??
					taggedAtomId(firstFieldReplace.change.dst, firstFieldReplace.revision),
			};
			if (composedFieldSrc !== undefined) {
				replace.src = composedFieldSrc;
			}
			composed.field = replace;
		}

		return composed;
	},

	invert: (
		{ revision, change }: TaggedChange<OptionalChangeset>,
		invertChild: NodeChangeInverter,
		isRollback: boolean,
		genId: IdAllocator<ChangesetLocalId>,
	): OptionalChangeset => {
		const { moves, childChanges } = change;
		const tagAtomId = (id: ChangeAtomId): ChangeAtomId => taggedAtomId(id, revision);
		const tagRegister = (id: RegisterId): RegisterId => (id === "self" ? id : tagAtomId(id));

		const invertIdMap = new RegisterMap<RegisterId>();
		const invertedMoves: Move[] = [];
		for (const [src, dst] of moves) {
			const taggedSrc = tagAtomId(src);
			const taggedDst = tagAtomId(dst);
			invertIdMap.set(taggedSrc, taggedDst);
			invertedMoves.push([taggedDst, taggedSrc]);
		}
		if (change.field !== undefined) {
			if (change.field.isEmpty === false) {
				invertIdMap.set("self", tagAtomId(change.field.dst));
			}
			if (change.field.src !== undefined) {
				invertIdMap.set(tagRegister(change.field.src), "self");
			}
		}

		const inverted: Mutable<OptionalChangeset> = {
			moves: invertedMoves,
			childChanges: childChanges.map(([id, childChange]) => {
				const taggedId = tagRegister(id);
				return [invertIdMap.get(taggedId) ?? taggedId, invertChild(childChange)];
			}),
		};

		if (change.field !== undefined) {
			if (isReplaceEffectful(change.field)) {
				const replace: Mutable<Replace> =
					change.field.src === undefined
						? {
								isEmpty: change.field.isEmpty,
								dst: makeChangeAtomId(genId.allocate()),
						  }
						: {
								isEmpty: false,
								dst: isRollback
									? tagAtomId(change.field.src)
									: makeChangeAtomId(genId.allocate()),
						  };
				if (change.field.isEmpty === false) {
					replace.src = tagAtomId(change.field.dst);
				}
				inverted.field = replace;
			} else if (!isRollback && change.field.src === "self") {
				inverted.field = {
					isEmpty: false,
					src: "self",
					dst: makeChangeAtomId(genId.allocate()),
				};
			}
		}
		return inverted;
	},

	rebase: (
		change: OptionalChangeset,
		overTagged: TaggedChange<OptionalChangeset>,
		rebaseChild: NodeChangeRebaser,
	): OptionalChangeset => {
		const tagAtomId = (id: ChangeAtomId): ChangeAtomId => taggedAtomId(id, overTagged.revision);
		const tagRegister = (id: RegisterId): RegisterId => (id === "self" ? id : tagAtomId(id));

		const { moves, childChanges, field } = change;
		const { change: overChange } = overTagged;

		// TODO: avoid computing the dstToSrc map if it's not needed.
		// TODO: de-dupe overSrcToDst and forwardMap
		const { srcToDst: overSrcToDst } = getBidirectionalMaps(
			overChange.moves,
			overTagged.revision,
		);

		const forwardMap = new RegisterMap<RegisterId>();
		for (const [src, dst] of overChange.moves) {
			forwardMap.set(tagAtomId(src), tagAtomId(dst));
		}
		if (overChange.field !== undefined) {
			if (overChange.field.isEmpty === false) {
				forwardMap.set("self", tagAtomId(overChange.field.dst));
			}
			if (overChange.field.src !== undefined) {
				forwardMap.set(tagRegister(overChange.field.src), "self");
			}
		}

		const rebasedMoves: Move[] = [];
		for (const [src, dst] of moves) {
			const newDst = tryGetFromNestedMap(overSrcToDst, src.revision, src.localId);
			rebasedMoves.push([src, newDst ?? dst]);
		}

		const overChildChangesBySrc = new RegisterMap<NodeChangeset>();
		for (const [id, childChange] of overChange.childChanges) {
			overChildChangesBySrc.set(tagRegister(id) ?? id, childChange);
		}

		const rebasedChildChanges: ChildChange[] = [];
		for (const [id, childChange] of childChanges) {
			const overChildChange = overChildChangesBySrc.get(id);

			const rebasedId = forwardMap.get(id) ?? id;
			const rebasedChildChange = rebaseChild(
				childChange,
				overChildChange,
				rebasedId === "self" ? NodeExistenceState.Alive : NodeExistenceState.Dead,
			);
			if (rebasedChildChange !== undefined) {
				rebasedChildChanges.push([rebasedId, rebasedChildChange]);
			}
		}

		const rebased: Mutable<OptionalChangeset> = {
			moves: rebasedMoves,
			childChanges: rebasedChildChanges,
		};

		if (field !== undefined) {
			const replace: Mutable<Replace> = {
				isEmpty:
					overChange.field === undefined
						? field.isEmpty
						: overChange.field.src === undefined,
				dst: field.dst,
			};
			if (field.src !== undefined) {
				replace.src = forwardMap.get(field.src) ?? field.src;
			}
			rebased.field = replace;
		}

		return rebased;
	},

	prune: (change: OptionalChangeset, pruneChild: NodeChangePruner): OptionalChangeset => {
		const childChanges: ChildChange[] = [];
		const prunedChange: Mutable<OptionalChangeset> = {
			moves: change.moves,
			childChanges,
		};
		if (change.field !== undefined) {
			prunedChange.field = change.field;
		}

		for (const [id, childChange] of change.childChanges) {
			const prunedChildChange = pruneChild(childChange);
			if (prunedChildChange !== undefined) {
				childChanges.push([id, prunedChildChange]);
			}
		}

		return prunedChange;
	},
};

function getBidirectionalMaps(
	moves: OptionalChangeset["moves"],
	revision: RevisionTag | undefined,
): {
	srcToDst: ChangeAtomIdMap<ChangeAtomId>;
	dstToSrc: ChangeAtomIdMap<ChangeAtomId>;
} {
	const srcToDst: ChangeAtomIdMap<ChangeAtomId> = new Map();
	const dstToSrc: ChangeAtomIdMap<ChangeAtomId> = new Map();
	for (const [src, dst] of moves) {
		const srcWithRevision = taggedAtomId(src, revision);
		const dstWithRevision = taggedAtomId(dst, revision);
		setInNestedMap(
			srcToDst,
			srcWithRevision.revision,
			srcWithRevision.localId,
			dstWithRevision,
		);
		setInNestedMap(
			dstToSrc,
			dstWithRevision.revision,
			dstWithRevision.localId,
			dstWithRevision,
		);
	}
	return { srcToDst, dstToSrc };
}

type EffectfulReplace =
	| {
			isEmpty: true;
			src?: ChangeAtomId;
			dst: ChangeAtomId;
	  }
	| {
			isEmpty: boolean;
			src: ChangeAtomId;
			dst: ChangeAtomId;
	  };

function isReplaceEffectful(replace: Replace): replace is EffectfulReplace {
	if (replace.src === "self") {
		return false;
	}
	return !replace.isEmpty || replace.src !== undefined;
}

function taggedOptRegister(
	id: RegisterId | undefined,
	revision: RevisionTag | undefined,
): RegisterId | undefined {
	return id !== undefined ? taggedRegister(id, revision) : undefined;
}

export function taggedAtomId(id: ChangeAtomId, revision: RevisionTag | undefined): ChangeAtomId {
	return makeChangeAtomId(id.localId, id.revision ?? revision);
}

export function taggedOptAtomId(
	id: ChangeAtomId | undefined,
	revision: RevisionTag | undefined,
): ChangeAtomId | undefined {
	if (id === undefined) {
		return undefined;
	}
	return taggedAtomId(id, revision);
}

export function taggedRegister(id: RegisterId, revision: RevisionTag | undefined): RegisterId {
	if (id === "self") {
		return id;
	}

	return taggedAtomId(id, revision);
}

export interface OptionalFieldEditor extends FieldEditor<OptionalChangeset> {
	/**
	 * Creates a change which replaces the field with `newContent`
	 * @param newContent - the new content for the field
	 * @param wasEmpty - whether the field is empty when creating this change
	 * @param changeId - the ID associated with the replacement of the current content.
	 * @param buildId - the ID associated with the creation of the `newContent`.
	 */
	set(
		wasEmpty: boolean,
		ids: {
			fill: ChangesetLocalId;
			detach: ChangesetLocalId;
		},
	): OptionalChangeset;

	/**
	 * Creates a change which clears the field's contents (if any).
	 * @param wasEmpty - whether the field is empty when creating this change
	 * @param changeId - the ID associated with the detach.
	 */
	clear(wasEmpty: boolean, id: ChangesetLocalId): OptionalChangeset;
}

export const optionalFieldEditor: OptionalFieldEditor = {
	set: (
		wasEmpty: boolean,
		ids: {
			fill: ChangesetLocalId;
			// Should be interpreted as a set of an empty field if undefined.
			detach: ChangesetLocalId;
		},
	): OptionalChangeset => ({
		moves: [],
		childChanges: [],
		field: {
			isEmpty: wasEmpty,
			src: { localId: ids.fill },
			dst: { localId: ids.detach },
		},
	}),

	clear: (wasEmpty: boolean, detachId: ChangesetLocalId): OptionalChangeset => ({
		moves: [],
		childChanges: [],
		field: {
			isEmpty: wasEmpty,
			dst: { localId: detachId },
		},
	}),

	buildChildChange: (index: number, childChange: NodeChangeset): OptionalChangeset => {
		assert(index === 0, 0x404 /* Optional fields only support a single child node */);
		return {
			moves: [],
			childChanges: [["self", childChange]],
		};
	},
};

export function optionalFieldIntoDelta(
	{ change, revision }: TaggedChange<OptionalChangeset>,
	deltaFromChild: ToDelta,
): DeltaFieldChanges {
	const delta: Mutable<DeltaFieldChanges> = {};

	let markIsANoop = true;
	const mark: Mutable<DeltaMark> = { count: 1 };

	if (change.field !== undefined && isReplaceEffectful(change.field)) {
		if (!change.field.isEmpty) {
			mark.detach = nodeIdFromChangeAtom(change.field.dst, revision);
		}
		if (change.field.src !== undefined) {
			mark.attach = nodeIdFromChangeAtom(change.field.src, revision);
		}
		markIsANoop = false;
	}

	if (change.moves.length > 0) {
		const renames: DeltaDetachedNodeRename[] = [];
		if (renames.length > 0) {
			delta.rename = change.moves.map(([src, dst]) => ({
				count: 1,
				oldId: nodeIdFromChangeAtom(src, revision),
				newId: nodeIdFromChangeAtom(dst, revision),
			}));
		}
	}

	if (change.childChanges.length > 0) {
		const globals: DeltaDetachedNodeChanges[] = [];
		for (const [id, childChange] of change.childChanges) {
			const childDelta = deltaFromChild(childChange);
			if (id !== "self") {
				const fields = childDelta;
				globals.push({
					id: { major: id.revision ?? revision, minor: id.localId },
					fields,
				});
			} else {
				mark.fields = childDelta;
				markIsANoop = false;
			}
		}

		if (globals.length > 0) {
			delta.global = globals;
		}
	}

	if (!markIsANoop) {
		delta.local = [mark];
	}

	return delta;
}

export const optionalChangeHandler: FieldChangeHandler<OptionalChangeset, OptionalFieldEditor> = {
	rebaser: optionalChangeRebaser,
	codecsFactory: makeOptionalFieldCodecFamily,
	editor: optionalFieldEditor,

	intoDelta: optionalFieldIntoDelta,
	relevantRemovedRoots,

	isEmpty: (change: OptionalChangeset) =>
		change.childChanges.length === 0 && change.moves.length === 0 && change.field === undefined,

	createEmpty: () => ({ moves: [], childChanges: [] }),
};

function* relevantRemovedRoots(
	{ change, revision }: TaggedChange<OptionalChangeset>,
	relevantRemovedRootsFromChild: RelevantRemovedRootsFromChild,
): Iterable<DeltaDetachedNodeId> {
	const alreadyYielded = new RegisterMap<boolean>();

	for (const [src] of change.moves) {
		if (!alreadyYielded.has(src)) {
			alreadyYielded.set(src, true);
			yield nodeIdFromChangeAtom(src, revision);
		}
	}

	for (const [id, childChange] of change.childChanges) {
		// Child changes make the tree they apply to relevant unless that tree existed in the starting context of
		// of this change.
		if (id !== "self" && !alreadyYielded.has(id)) {
			alreadyYielded.set(id, true);
			yield nodeIdFromChangeAtom(id);
		}
		yield* relevantRemovedRootsFromChild(childChange);
	}

	const selfSrc = change.field?.src;
	if (selfSrc !== undefined && selfSrc !== "self" && !alreadyYielded.has(selfSrc)) {
		yield nodeIdFromChangeAtom(selfSrc);
	}
}
