/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils/internal";
import { BTree } from "@tylerbu/sorted-btree-es6";

import type { ICodecFamily } from "../../codec/index.js";
import {
	type ChangeAtomIdMap,
	type ChangeEncodingContext,
	type ChangeFamily,
	type ChangeFamilyEditor,
	type ChangeRebaser,
	type ChangesetLocalId,
	CursorLocationType,
	type DeltaDetachedNodeBuild,
	type DeltaDetachedNodeDestruction,
	type DeltaDetachedNodeId,
	type DeltaFieldChanges,
	type DeltaFieldMap,
	type DeltaRoot,
	EditBuilder,
	type FieldKey,
	type FieldKindIdentifier,
	type FieldUpPath,
	type ITreeCursorSynchronous,
	type RevisionInfo,
	type RevisionMetadataSource,
	type RevisionTag,
	type TaggedChange,
	type UpPath,
	isEmptyFieldChanges,
	makeAnonChange,
	makeDetachedNodeId,
	mapCursorField,
	replaceAtomRevisions,
	revisionMetadataSourceFromInfo,
	setInChangeAtomIdMap,
	areEqualChangeAtomIds,
	getFromChangeAtomIdMap,
	type ChangeAtomId,
} from "../../core/index.js";
import {
	type IdAllocationState,
	type IdAllocator,
	type Mutable,
	brand,
	deleteFromNestedMap,
	fail,
	forEachInNestedMap,
	getOrAddInMap,
	idAllocatorFromMaxId,
	idAllocatorFromState,
	nestedMapFromFlatList,
	nestedMapToFlatList,
	populateNestedMap,
	setInNestedMap,
	tryGetFromNestedMap,
	type NestedMap,
	type RangeQueryResult,
} from "../../util/index.js";
import {
	type TreeChunk,
	chunkFieldSingle,
	chunkTree,
	defaultChunkPolicy,
} from "../chunked-forest/index.js";
import { cursorForMapTreeNode, mapTreeFromCursor } from "../mapTreeCursor.js";
import { MemoizedIdRangeAllocator } from "../memoizedIdRangeAllocator.js";

import {
	type CrossFieldManager,
	type CrossFieldMap,
	CrossFieldTarget,
	getFirstFromCrossFieldMap,
	setInCrossFieldMap,
} from "./crossFieldQueries.js";
import {
	type FieldChangeHandler,
	NodeAttachState,
	type RebaseRevisionMetadata,
} from "./fieldChangeHandler.js";
import { type FieldKindWithEditor, withEditor } from "./fieldKindWithEditor.js";
import { convertGenericChange, genericFieldKind } from "./genericFieldKind.js";
import type { GenericChangeset } from "./genericFieldKindTypes.js";
import type {
	CrossFieldKeyRange,
	CrossFieldKeyTable,
	FieldChange,
	FieldChangeMap,
	FieldChangeset,
	FieldId,
	ModularChangeset,
	NodeChangeset,
	NodeId,
	TupleBTree,
} from "./modularChangeTypes.js";

/**
 * Implementation of ChangeFamily which delegates work in a given field to the appropriate FieldKind
 * as determined by the schema.
 */
export class ModularChangeFamily
	implements
		ChangeFamily<ModularEditBuilder, ModularChangeset>,
		ChangeRebaser<ModularChangeset>
{
	public static readonly emptyChange: ModularChangeset = makeModularChangeset();

	public readonly fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>;

	public constructor(
		fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
		public readonly codecs: ICodecFamily<ModularChangeset, ChangeEncodingContext>,
	) {
		this.fieldKinds = fieldKinds;
	}

	public get rebaser(): ChangeRebaser<ModularChangeset> {
		return this;
	}

	/**
	 * Produces an equivalent list of `FieldChangeset`s that all target the same {@link FlexFieldKind}.
	 * @param changes - The list of `FieldChange`s whose `FieldChangeset`s needs to be normalized.
	 * @returns An object that contains both the equivalent list of `FieldChangeset`s that all
	 * target the same {@link FlexFieldKind}, and the `FieldKind` that they target.
	 * The returned `FieldChangeset`s may be a shallow copy of the input `FieldChange`s.
	 */
	private normalizeFieldChanges(
		change1: FieldChange,
		change2: FieldChange,
		genId: IdAllocator,
		revisionMetadata: RevisionMetadataSource,
	): {
		fieldKind: FieldKindIdentifier;
		changeHandler: FieldChangeHandler<unknown>;
		change1: FieldChangeset;
		change2: FieldChangeset;
	} {
		// TODO: Handle the case where changes have conflicting field kinds
		const kind =
			change1 !== undefined && change1.fieldKind !== genericFieldKind.identifier
				? change1.fieldKind
				: change2?.fieldKind ?? genericFieldKind.identifier;

		if (kind === genericFieldKind.identifier) {
			// All the changes are generic
			return {
				fieldKind: genericFieldKind.identifier,
				changeHandler: genericFieldKind.changeHandler,
				change1: change1?.change,
				change2: change2?.change,
			};
		}
		const fieldKind = getFieldKind(this.fieldKinds, kind);
		const changeHandler = fieldKind.changeHandler;
		const normalizedChange1 = this.normalizeFieldChange(
			change1,
			changeHandler,
			genId,
			revisionMetadata,
		);
		const normalizedChange2 = this.normalizeFieldChange(
			change2,
			changeHandler,
			genId,
			revisionMetadata,
		);
		return {
			fieldKind: kind,
			changeHandler,
			change1: normalizedChange1,
			change2: normalizedChange2,
		};
	}

	private normalizeFieldChange<T>(
		fieldChange: FieldChange,
		handler: FieldChangeHandler<T>,
		genId: IdAllocator,
		revisionMetadata: RevisionMetadataSource,
	): FieldChangeset {
		if (fieldChange.fieldKind !== genericFieldKind.identifier) {
			return fieldChange.change;
		}

		// The cast is based on the `fieldKind` check above
		const genericChange = fieldChange.change as unknown as GenericChangeset;
		const convertedChange = convertGenericChange(
			genericChange,
			handler,
			(child1, child2) => {
				assert(
					child1 === undefined || child2 === undefined,
					0x92f /* Should not have two changesets to compose */,
				);

				return child1 ?? child2 ?? fail("Should not compose two undefined node IDs");
			},
			genId,
			revisionMetadata,
		) as FieldChangeset;

		return convertedChange;
	}

	public compose(changes: TaggedChange<ModularChangeset>[]): ModularChangeset {
		const { revInfos, maxId } = getRevInfoFromTaggedChanges(changes);
		const idState: IdAllocationState = { maxId };

		return changes.reduce(
			(change1, change2) =>
				makeAnonChange(this.composePair(change1, change2, revInfos, idState)),
			makeAnonChange({
				fieldChanges: new Map(),
				nodeChanges: new Map(),
				nodeToParent: new Map(),
				nodeAliases: new Map(),
				crossFieldKeys: newCrossFieldKeyTable(),
			}),
		).change;
	}

	private composePair(
		change1: TaggedChange<ModularChangeset>,
		change2: TaggedChange<ModularChangeset>,
		revInfos: RevisionInfo[],
		idState: IdAllocationState,
	): ModularChangeset {
		const { fieldChanges, nodeChanges, nodeToParent, nodeAliases, crossFieldKeys } =
			this.composeAllFields(change1.change, change2.change, revInfos, idState);

		const { allBuilds, allDestroys, allRefreshers } = composeBuildsDestroysAndRefreshers([
			change1,
			change2,
		]);

		return makeModularChangeset(
			this.pruneFieldMap(fieldChanges, nodeChanges),
			nodeChanges,
			nodeToParent,
			nodeAliases,
			crossFieldKeys,
			idState.maxId,
			revInfos,
			undefined,
			allBuilds,
			allDestroys,
			allRefreshers,
		);
	}

	private composeAllFields(
		change1: ModularChangeset,
		change2: ModularChangeset,
		revInfos: RevisionInfo[],
		idState: IdAllocationState,
	): ModularChangesetContent {
		if (hasConflicts(change1) && hasConflicts(change2)) {
			return {
				fieldChanges: new Map(),
				nodeChanges: new Map(),
				nodeToParent: new Map(),
				nodeAliases: new Map(),
				crossFieldKeys: newBTree(),
			};
		} else if (hasConflicts(change1)) {
			return change2;
		} else if (hasConflicts(change2)) {
			return change1;
		}

		const genId: IdAllocator = idAllocatorFromState(idState);
		const revisionMetadata: RevisionMetadataSource = revisionMetadataSourceFromInfo(revInfos);

		const crossFieldTable = newComposeTable(change1, change2);

		const composedNodeChanges: ChangeAtomIdMap<NodeChangeset> = mergeNestedMaps(
			change1.nodeChanges,
			change2.nodeChanges,
		);

		const composedNodeToParent = mergeNestedMaps(change1.nodeToParent, change2.nodeToParent);

		const composedNodeAliases: ChangeAtomIdMap<NodeId> = mergeNestedMaps(
			change1.nodeAliases,
			change2.nodeAliases,
		);

		// First we compose the root fields.
		const composedFields = this.composeFieldMaps(
			change1.fieldChanges,
			change2.fieldChanges,
			genId,
			crossFieldTable,
			revisionMetadata,
		);

		this.processInvalidatedElements(
			crossFieldTable,
			composedFields,
			composedNodeChanges,
			composedNodeToParent,
			composedNodeAliases,
			genId,
			revisionMetadata,
		);

		return {
			fieldChanges: composedFields,
			nodeChanges: composedNodeChanges,
			nodeToParent: composedNodeToParent,
			nodeAliases: composedNodeAliases,
			crossFieldKeys: brand(mergeBTrees(change1.crossFieldKeys, change2.crossFieldKeys)),
		};
	}

	private composeInvalidatedField(
		fieldChange: FieldChange,
		crossFieldTable: ComposeTable,
		genId: IdAllocator,
		revisionMetadata: RevisionMetadataSource,
	): void {
		const context = crossFieldTable.fieldToContext.get(fieldChange);
		assert(context !== undefined, 0x8cc /* Should have context for every invalidated field */);
		const { change1: fieldChange1, change2: fieldChange2, composedChange } = context;

		const rebaser = getChangeHandler(this.fieldKinds, composedChange.fieldKind).rebaser;
		const composeNodes = (child1: NodeId | undefined, child2: NodeId | undefined): NodeId => {
			if (
				child1 !== undefined &&
				child2 !== undefined &&
				getFromChangeAtomIdMap(crossFieldTable.newToBaseNodeId, child2) === undefined
			) {
				setInChangeAtomIdMap(crossFieldTable.newToBaseNodeId, child2, child1);
				crossFieldTable.pendingCompositions.nodeIdsToCompose.push([child1, child2]);
			}

			return child1 ?? child2 ?? fail("Should not compose two undefined nodes");
		};

		const amendedChange = rebaser.compose(
			fieldChange1,
			fieldChange2,
			composeNodes,
			genId,
			new ComposeManager(crossFieldTable, fieldChange, false),
			revisionMetadata,
		);
		composedChange.change = brand(amendedChange);
	}

	/**
	 * Updates everything in the composed output which may no longer be valid.
	 * This could be due to
	 * - discovering that two node changesets refer to the same node (`nodeIdsToCompose`)
	 * - a previously composed field being invalidated by a cross field effect (`invalidatedFields`)
	 * - a field which was copied directly from an input changeset being invalidated by a cross field effect
	 * (`affectedBaseFields` and `affectedNewFields`)
	 *
	 * Updating an element may invalidate further elements. This function runs until there is no more invalidation.
	 */
	private processInvalidatedElements(
		table: ComposeTable,
		composedFields: FieldChangeMap,
		composedNodes: ChangeAtomIdMap<NodeChangeset>,
		composedNodeToParent: ChangeAtomIdMap<FieldId>,
		nodeAliases: ChangeAtomIdMap<NodeId>,
		genId: IdAllocator,
		metadata: RevisionMetadataSource,
	): void {
		const pending = table.pendingCompositions;
		while (
			table.invalidatedFields.size > 0 ||
			pending.nodeIdsToCompose.length > 0 ||
			pending.affectedBaseFields.length > 0 ||
			pending.affectedNewFields.length > 0
		) {
			// Note that the call to `composeNodesById` can add entries to `crossFieldTable.nodeIdPairs`.
			for (const [id1, id2] of pending.nodeIdsToCompose) {
				this.composeNodesById(
					table.baseChange.nodeChanges,
					table.newChange.nodeChanges,
					composedNodes,
					composedNodeToParent,
					nodeAliases,
					id1,
					id2,
					genId,
					table,
					metadata,
				);
			}

			pending.nodeIdsToCompose.length = 0;

			this.composeAffectedFields(
				table,
				table.baseChange,
				true,
				pending.affectedBaseFields,
				composedFields,
				composedNodes,
				genId,
				metadata,
			);

			this.composeAffectedFields(
				table,
				table.newChange,
				false,
				pending.affectedNewFields,
				composedFields,
				composedNodes,
				genId,
				metadata,
			);

			this.processInvalidatedCompositions(table, genId, metadata);
		}
	}

	private processInvalidatedCompositions(
		table: ComposeTable,
		genId: IdAllocator,
		metadata: RevisionMetadataSource,
	): void {
		const fieldsToUpdate = table.invalidatedFields;
		table.invalidatedFields = new Set();
		for (const fieldChange of fieldsToUpdate) {
			this.composeInvalidatedField(fieldChange, table, genId, metadata);
		}
	}

	/**
	 * Ensures that each field in `affectedFields` has been updated in the composition output.
	 * Any field which has already been composed is ignored.
	 * All other fields are optimistically assumed to not have any changes in the other input changeset.
	 *
	 * @param change - The changeset which contains the affected fields.
	 * This should be one of the two changesets being composed.
	 * @param areBaseFields - Whether the affected fields are part of the base changeset.
	 * If not, they are assumed to be part of the new changeset.
	 * @param affectedFields - The set of fields to process.
	 */
	private composeAffectedFields(
		table: ComposeTable,
		change: ModularChangeset,
		areBaseFields: boolean,
		affectedFields: BTree<FieldIdKey, true>,
		composedFields: FieldChangeMap,
		composedNodes: ChangeAtomIdMap<NodeChangeset>,
		genId: IdAllocator,
		metadata: RevisionMetadataSource,
	): void {
		for (const fieldIdKey of affectedFields.keys()) {
			const fieldId = normalizeFieldId(fieldIdFromFieldIdKey(fieldIdKey), change.nodeAliases);
			const fieldChange = fieldChangeFromId(change.fieldChanges, change.nodeChanges, fieldId);

			if (
				table.fieldToContext.has(fieldChange) ||
				table.newFieldToBaseField.has(fieldChange)
			) {
				continue;
			}

			const emptyChange = this.createEmptyFieldChange(fieldChange.fieldKind);
			const [change1, change2] = areBaseFields
				? [fieldChange, emptyChange]
				: [emptyChange, fieldChange];

			const composedField = this.composeFieldChanges(change1, change2, genId, table, metadata);

			if (fieldId.nodeId === undefined) {
				composedFields.set(fieldId.field, composedField);
				continue;
			}

			const nodeId =
				getFromChangeAtomIdMap(table.newToBaseNodeId, fieldId.nodeId) ?? fieldId.nodeId;

			let nodeChangeset = nodeChangeFromId(composedNodes, nodeId);
			if (!table.composedNodes.has(nodeChangeset)) {
				nodeChangeset = cloneNodeChangeset(nodeChangeset);
				setInChangeAtomIdMap(composedNodes, nodeId, nodeChangeset);
			}

			if (nodeChangeset.fieldChanges === undefined) {
				nodeChangeset.fieldChanges = new Map();
			}

			nodeChangeset.fieldChanges.set(fieldId.field, composedField);
		}

		affectedFields.clear();
	}

	private composeFieldMaps(
		change1: FieldChangeMap | undefined,
		change2: FieldChangeMap | undefined,
		genId: IdAllocator,
		crossFieldTable: ComposeTable,
		revisionMetadata: RevisionMetadataSource,
	): FieldChangeMap {
		const composedFields: FieldChangeMap = new Map();
		if (change1 === undefined || change2 === undefined) {
			return change1 ?? change2 ?? composedFields;
		}

		for (const [field, fieldChange1] of change1) {
			const fieldChange2 = change2.get(field);
			const composedField =
				fieldChange2 !== undefined
					? this.composeFieldChanges(
							fieldChange1,
							fieldChange2,
							genId,
							crossFieldTable,
							revisionMetadata,
						)
					: fieldChange1;

			composedFields.set(field, composedField);
		}

		for (const [field, fieldChange2] of change2) {
			if (change1 === undefined || !change1.has(field)) {
				composedFields.set(field, fieldChange2);
			}
		}

		return composedFields;
	}

	/**
	 * Returns the composition of the two input fields.
	 *
	 * Any nodes in this field which were modified by both changesets
	 * will be added to `crossFieldTable.pendingCompositions.nodeIdsToCompose`.
	 *
	 * Any fields which had cross-field information sent to them as part of this field composition
	 * will be added to either `affectedBaseFields` or `affectedNewFields` in `crossFieldTable.pendingCompositions`.
	 *
	 * Any composed `FieldChange` which is invalidated by new cross-field information will be added to `crossFieldTable.invalidatedFields`.
	 */
	private composeFieldChanges(
		change1: FieldChange,
		change2: FieldChange,
		idAllocator: IdAllocator,
		crossFieldTable: ComposeTable,
		revisionMetadata: RevisionMetadataSource,
	): FieldChange {
		const {
			fieldKind,
			changeHandler,
			change1: normalizedFieldChange1,
			change2: normalizedFieldChange2,
		} = this.normalizeFieldChanges(change1, change2, idAllocator, revisionMetadata);

		const manager = new ComposeManager(crossFieldTable, change1 ?? change2);
		const change1Normalized = normalizedFieldChange1 ?? changeHandler.createEmpty();
		const change2Normalized = normalizedFieldChange2 ?? changeHandler.createEmpty();

		const composedChange = changeHandler.rebaser.compose(
			change1Normalized,
			change2Normalized,
			(child1, child2) => {
				if (child1 !== undefined && child2 !== undefined) {
					setInChangeAtomIdMap(crossFieldTable.newToBaseNodeId, child2, child1);
					crossFieldTable.pendingCompositions.nodeIdsToCompose.push([child1, child2]);
				}
				return child1 ?? child2 ?? fail("Should not compose two undefined nodes");
			},
			idAllocator,
			manager,
			revisionMetadata,
		);

		const composedField: FieldChange = {
			fieldKind,
			change: brand(composedChange),
		};

		crossFieldTable.fieldToContext.set(change1, {
			change1: change1Normalized,
			change2: change2Normalized,
			composedChange: composedField,
		});

		crossFieldTable.newFieldToBaseField.set(change2, change1);
		return composedField;
	}

	private composeNodesById(
		nodeChanges1: ChangeAtomIdMap<NodeChangeset>,
		nodeChanges2: ChangeAtomIdMap<NodeChangeset>,
		composedNodes: ChangeAtomIdMap<NodeChangeset>,
		composedNodeToParent: ChangeAtomIdMap<FieldId>,
		nodeAliases: ChangeAtomIdMap<NodeId>,
		id1: NodeId,
		id2: NodeId,
		idAllocator: IdAllocator,
		crossFieldTable: ComposeTable,
		revisionMetadata: RevisionMetadataSource,
	): void {
		const nodeChangeset1 = nodeChangeFromId(nodeChanges1, id1);
		const nodeChangeset2 = nodeChangeFromId(nodeChanges2, id2);
		const composedNodeChangeset = this.composeNodeChanges(
			nodeChangeset1,
			nodeChangeset2,
			idAllocator,
			crossFieldTable,
			revisionMetadata,
		);

		setInChangeAtomIdMap(composedNodes, id1, composedNodeChangeset);

		if (!areEqualChangeAtomIds(id1, id2)) {
			deleteFromNestedMap(composedNodes, id2.revision, id2.localId);
			deleteFromNestedMap(composedNodeToParent, id2.revision, id2.localId);
			setInChangeAtomIdMap(nodeAliases, id2, id1);

			// We need to delete id1 to avoid forming a cycle in case id1 already had an alias.
			deleteFromNestedMap(nodeAliases, id1.revision, id1.localId);
		}

		crossFieldTable.composedNodes.add(composedNodeChangeset);
	}

	private composeNodeChanges(
		change1: NodeChangeset,
		change2: NodeChangeset,
		genId: IdAllocator,
		crossFieldTable: ComposeTable,
		revisionMetadata: RevisionMetadataSource,
	): NodeChangeset {
		const nodeExistsConstraint =
			change1?.nodeExistsConstraint ?? change2?.nodeExistsConstraint;

		const composedFieldChanges = this.composeFieldMaps(
			change1.fieldChanges,
			change2.fieldChanges,
			genId,
			crossFieldTable,
			revisionMetadata,
		);

		const composedNodeChange: NodeChangeset = {};

		if (composedFieldChanges.size > 0) {
			composedNodeChange.fieldChanges = composedFieldChanges;
		}

		if (nodeExistsConstraint !== undefined) {
			composedNodeChange.nodeExistsConstraint = nodeExistsConstraint;
		}

		return composedNodeChange;
	}

	/**
	 * @param change - The change to invert.
	 * @param isRollback - Whether the inverted change is meant to rollback a change on a branch as is the case when
	 * performing a sandwich rebase.
	 */
	public invert(
		change: TaggedChange<ModularChangeset>,
		isRollback: boolean,
	): ModularChangeset {
		// Rollback changesets destroy the nodes created by the change being rolled back.
		const destroys = isRollback
			? invertBuilds(change.change.builds, change.revision)
			: undefined;

		// Destroys only occur in rollback changesets, which are never inverted.
		assert(
			change.change.destroys === undefined,
			0x89a /* Unexpected destroys in change to invert */,
		);

		if ((change.change.constraintViolationCount ?? 0) > 0) {
			return makeModularChangeset(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				change.change.maxId,
				[],
				undefined,
				undefined,
				destroys,
			);
		}

		const genId: IdAllocator = idAllocatorFromMaxId(change.change.maxId ?? -1);
		const invertedNodeToParent = cloneNestedMap(change.change.nodeToParent);

		const crossFieldTable: InvertTable = {
			...newCrossFieldTable<FieldChange>(),
			originalFieldToContext: new Map(),
			invertedNodeToParent,
		};

		const { revInfos } = getRevInfoFromTaggedChanges([change]);
		const revisionMetadata = revisionMetadataSourceFromInfo(revInfos);

		const invertedFields = this.invertFieldMap(
			change.change.fieldChanges,
			undefined,
			isRollback,
			genId,
			crossFieldTable,
			revisionMetadata,
		);

		const invertedNodes: ChangeAtomIdMap<NodeChangeset> = new Map();
		forEachInNestedMap(change.change.nodeChanges, (nodeChangeset, revision, localId) => {
			setInNestedMap(
				invertedNodes,
				revision,
				localId,
				this.invertNodeChange(
					nodeChangeset,
					{ revision, localId },
					isRollback,
					genId,
					crossFieldTable,
					revisionMetadata,
				),
			);
		});

		if (crossFieldTable.invalidatedFields.size > 0) {
			const fieldsToUpdate = crossFieldTable.invalidatedFields;
			crossFieldTable.invalidatedFields = new Set();
			for (const fieldChange of fieldsToUpdate) {
				const originalFieldChange = fieldChange.change;
				const context = crossFieldTable.originalFieldToContext.get(fieldChange);
				assert(
					context !== undefined,
					0x851 /* Should have context for every invalidated field */,
				);
				const { invertedField, fieldId } = context;

				const amendedChange = getChangeHandler(
					this.fieldKinds,
					fieldChange.fieldKind,
				).rebaser.invert(
					originalFieldChange,
					isRollback,
					genId,
					new InvertManager(crossFieldTable, fieldChange, fieldId),
					revisionMetadata,
				);
				invertedField.change = brand(amendedChange);
			}
		}

		const crossFieldKeys = this.makeCrossFieldKeyTable(invertedFields, invertedNodes);

		return makeModularChangeset(
			invertedFields,
			invertedNodes,
			invertedNodeToParent,
			change.change.nodeAliases,
			crossFieldKeys,
			genId.getMaxId(),
			[],
			change.change.constraintViolationCount,
			undefined,
			destroys,
		);
	}

	private invertFieldMap(
		changes: FieldChangeMap,
		parentId: NodeId | undefined,
		isRollback: boolean,
		genId: IdAllocator,
		crossFieldTable: InvertTable,
		revisionMetadata: RevisionMetadataSource,
	): FieldChangeMap {
		const invertedFields: FieldChangeMap = new Map();

		for (const [field, fieldChange] of changes) {
			const fieldId = { nodeId: parentId, field };
			const manager = new InvertManager(crossFieldTable, fieldChange, fieldId);
			const invertedChange = getChangeHandler(
				this.fieldKinds,
				fieldChange.fieldKind,
			).rebaser.invert(fieldChange.change, isRollback, genId, manager, revisionMetadata);

			const invertedFieldChange: FieldChange = {
				...fieldChange,
				change: brand(invertedChange),
			};
			invertedFields.set(field, invertedFieldChange);

			crossFieldTable.originalFieldToContext.set(fieldChange, {
				fieldId,
				invertedField: invertedFieldChange,
			});
		}

		return invertedFields;
	}

	private invertNodeChange(
		change: NodeChangeset,
		id: NodeId,
		isRollback: boolean,
		genId: IdAllocator,
		crossFieldTable: InvertTable,
		revisionMetadata: RevisionMetadataSource,
	): NodeChangeset {
		const inverse: NodeChangeset = {};

		if (change.fieldChanges !== undefined) {
			inverse.fieldChanges = this.invertFieldMap(
				change.fieldChanges,
				id,
				isRollback,
				genId,
				crossFieldTable,
				revisionMetadata,
			);
		}

		return inverse;
	}

	public rebase(
		taggedChange: TaggedChange<ModularChangeset>,
		over: TaggedChange<ModularChangeset>,
		revisionMetadata: RevisionMetadataSource,
	): ModularChangeset {
		const change = taggedChange.change;
		const maxId = Math.max(change.maxId ?? -1, over.change.maxId ?? -1);
		const idState: IdAllocationState = { maxId };
		const genId: IdAllocator = idAllocatorFromState(idState);

		const crossFieldTable: RebaseTable = {
			...newCrossFieldTable<FieldChange>(),
			newChange: change,
			baseChange: over.change,
			baseFieldToContext: new Map(),
			baseToRebasedNodeId: new Map(),
			rebasedFields: new Set(),
			rebasedNodeToParent: cloneNestedMap(change.nodeToParent),
			rebasedCrossFieldKeys: brand(change.crossFieldKeys.clone()),
			nodeIdPairs: [],
			affectedNewFields: newBTree(),
			affectedBaseFields: newBTree(),
		};

		let constraintState = newConstraintState(change.constraintViolationCount ?? 0);

		const getBaseRevisions = (): RevisionTag[] =>
			revisionInfoFromTaggedChange(over).map((info) => info.revision);

		const rebaseMetadata: RebaseRevisionMetadata = {
			...revisionMetadata,
			getRevisionToRebase: () => taggedChange.revision,
			getBaseRevisions,
		};

		const rebasedNodes: ChangeAtomIdMap<NodeChangeset> = cloneNestedMap(change.nodeChanges);

		const rebasedFields = this.rebaseIntersectingFields(
			crossFieldTable,
			rebasedNodes,
			genId,
			constraintState,
			rebaseMetadata,
		);

		this.rebaseFieldsWithoutBaseChanges(
			rebasedFields,
			rebasedNodes,
			crossFieldTable,
			genId,
			rebaseMetadata,
		);

		this.rebaseFieldsWithoutNewChanges(
			rebasedFields,
			rebasedNodes,
			crossFieldTable,
			genId,
			rebaseMetadata,
		);

		if (crossFieldTable.invalidatedFields.size > 0) {
			const fieldsToUpdate = crossFieldTable.invalidatedFields;
			crossFieldTable.invalidatedFields = new Set();
			constraintState = newConstraintState(change.constraintViolationCount ?? 0);
			for (const field of fieldsToUpdate) {
				const context = crossFieldTable.baseFieldToContext.get(field);
				assert(context !== undefined, 0x852 /* Every field should have a context */);
				const {
					changeHandler,
					change1: fieldChangeset,
					change2: baseChangeset,
				} = this.normalizeFieldChanges(
					context.newChange,
					context.baseChange,
					genId,
					revisionMetadata,
				);

				const rebaseChild = (
					curr: NodeId | undefined,
					base: NodeId | undefined,
				): NodeId | undefined => {
					if (curr !== undefined) {
						return curr;
					}

					if (base !== undefined) {
						for (const id of context.baseNodeIds) {
							if (areEqualChangeAtomIds(base, id)) {
								return base;
							}
						}
					}

					return undefined;
				};

				context.rebasedChange.change = brand(
					changeHandler.rebaser.rebase(
						fieldChangeset,
						baseChangeset,
						rebaseChild,
						genId,
						new RebaseManager(crossFieldTable, field, context.fieldId),
						rebaseMetadata,
					),
				);
			}
		}

		this.updateConstraintsForFields(
			rebasedFields,
			NodeAttachState.Attached,
			constraintState,
			rebasedNodes,
		);

		return makeModularChangeset(
			this.pruneFieldMap(rebasedFields, rebasedNodes),
			rebasedNodes,
			crossFieldTable.rebasedNodeToParent,
			change.nodeAliases,
			crossFieldTable.rebasedCrossFieldKeys,
			idState.maxId,
			change.revisions,
			constraintState.violationCount,
			change.builds,
			change.destroys,
			change.refreshers,
		);
	}

	// This performs a first pass on all fields which have both new and base changes.
	// TODO: Can we also handle additional passes in this method?
	private rebaseIntersectingFields(
		crossFieldTable: RebaseTable,
		rebasedNodes: ChangeAtomIdMap<NodeChangeset>,
		genId: IdAllocator,
		constraintState: ConstraintState,
		metadata: RebaseRevisionMetadata,
	): FieldChangeMap {
		const change = crossFieldTable.newChange;
		const baseChange = crossFieldTable.baseChange;
		const rebasedFields = this.rebaseFieldMap(
			change.fieldChanges,
			baseChange.fieldChanges,
			undefined,
			genId,
			crossFieldTable,
			metadata,
		);

		// This loop processes all fields which have both base and new changes.
		// Note that the call to `rebaseNodeChanges` can add entries to `crossFieldTable.nodeIdPairs`.
		for (const [newId, baseId, _attachState] of crossFieldTable.nodeIdPairs) {
			const rebasedNode = this.rebaseNodeChange(
				newId,
				baseId,
				genId,
				crossFieldTable,
				metadata,
				constraintState,
			);

			if (rebasedNode !== undefined) {
				setInChangeAtomIdMap(rebasedNodes, newId, rebasedNode);
			}
		}

		return rebasedFields;
	}

	// This processes fields which have no base changes but have been invalidated by another field.
	private rebaseFieldsWithoutBaseChanges(
		rebasedFields: FieldChangeMap,
		rebasedNodes: ChangeAtomIdMap<NodeChangeset>,
		crossFieldTable: RebaseTable,
		genId: IdAllocator,
		metadata: RebaseRevisionMetadata,
	): void {
		for (const [revision, localId, fieldKey] of crossFieldTable.affectedNewFields.keys()) {
			const nodeId: NodeId | undefined =
				localId !== undefined ? { revision, localId } : undefined;

			const fieldMap = fieldMapFromNodeId(rebasedFields, rebasedNodes, nodeId);

			const fieldChange = fieldMap.get(fieldKey);
			assert(fieldChange !== undefined, "Cross field key registered for empty field");

			if (crossFieldTable.rebasedFields.has(fieldChange)) {
				// This field has already been processed because there were base changes.
				continue;
			}

			// This field has no changes in the base changeset, otherwise it would have been added to `crossFieldTable.rebasedFields`
			// when processing fields with both base and new changes.
			const rebaseChild = (
				child: NodeId | undefined,
				baseChild: NodeId | undefined,
				stateChange: NodeAttachState | undefined,
			): NodeId | undefined => {
				assert(baseChild === undefined, "There should be no base changes in this field");
				return child;
			};

			const handler = getChangeHandler(this.fieldKinds, fieldChange.fieldKind);
			const baseFieldChange: FieldChange = {
				...fieldChange,
				change: brand(handler.createEmpty()),
			};

			const fieldId: FieldId = { nodeId, field: fieldKey };
			const rebasedField = handler.rebaser.rebase(
				fieldChange.change,
				baseFieldChange.change,
				rebaseChild,
				genId,
				new RebaseManager(crossFieldTable, baseFieldChange, fieldId),
				metadata,
			);

			const rebasedFieldChange: FieldChange = { ...fieldChange, change: brand(rebasedField) };
			fieldMap.set(fieldKey, rebasedFieldChange);

			// TODO: Deduplicate these lines with other rebase locations.
			crossFieldTable.baseFieldToContext.set(baseFieldChange, {
				newChange: fieldChange,
				baseChange: baseFieldChange,
				rebasedChange: rebasedFieldChange,
				fieldId,
				baseNodeIds: [],
			});
			crossFieldTable.rebasedFields.add(rebasedFieldChange);
		}
	}

	// This processes fields which have no new changes but have been invalidated by another field.
	private rebaseFieldsWithoutNewChanges(
		rebasedFields: FieldChangeMap,
		rebasedNodes: ChangeAtomIdMap<NodeChangeset>,
		crossFieldTable: RebaseTable,
		genId: IdAllocator,
		metadata: RebaseRevisionMetadata,
	): void {
		const baseChange = crossFieldTable.baseChange;
		for (const [revision, localId, fieldKey] of crossFieldTable.affectedBaseFields.keys()) {
			const baseNodeId =
				localId !== undefined
					? normalizeNodeId({ revision, localId }, baseChange.nodeAliases)
					: undefined;

			const baseFieldChange = fieldMapFromNodeId(
				baseChange.fieldChanges,
				baseChange.nodeChanges,
				baseNodeId,
			).get(fieldKey);

			assert(baseFieldChange !== undefined, "Cross field key registered for empty field");
			if (crossFieldTable.baseFieldToContext.has(baseFieldChange)) {
				// This field has already been processed because there were changes to rebase.
				continue;
			}

			// This field has no changes in the new changeset, otherwise it would have been added to
			// `crossFieldTable.baseFieldToContext` when processing fields with both base and new changes.
			const rebaseChild = (
				child: NodeId | undefined,
				baseChild: NodeId | undefined,
				stateChange: NodeAttachState | undefined,
			): NodeId | undefined => {
				assert(child === undefined, "There should be no new changes in this field");
				return undefined;
			};

			const handler = getChangeHandler(this.fieldKinds, baseFieldChange.fieldKind);
			const fieldChange: FieldChange = {
				...baseFieldChange,
				change: brand(handler.createEmpty()),
			};

			const rebasedNodeId =
				baseNodeId !== undefined
					? rebasedNodeIdFromBaseNodeId(crossFieldTable, baseNodeId)
					: undefined;

			const fieldId: FieldId = { nodeId: rebasedNodeId, field: fieldKey };
			const rebasedField: unknown = handler.rebaser.rebase(
				fieldChange.change,
				baseFieldChange.change,
				rebaseChild,
				genId,
				new RebaseManager(crossFieldTable, baseFieldChange, fieldId),
				metadata,
			);

			const rebasedFieldChange: FieldChange = {
				...baseFieldChange,
				change: brand(rebasedField),
			};

			// TODO: Deduplicate
			crossFieldTable.baseFieldToContext.set(baseFieldChange, {
				newChange: fieldChange,
				baseChange: baseFieldChange,
				rebasedChange: rebasedFieldChange,
				fieldId,
				baseNodeIds: [],
			});
			crossFieldTable.rebasedFields.add(rebasedFieldChange);

			this.attachRebasedField(
				rebasedFields,
				rebasedNodes,
				crossFieldTable,
				rebasedFieldChange,
				fieldId,
				genId,
				metadata,
			);
		}
	}

	private attachRebasedField(
		rebasedFields: FieldChangeMap,
		rebasedNodes: ChangeAtomIdMap<NodeChangeset>,
		table: RebaseTable,
		rebasedField: FieldChange,
		{ nodeId, field: fieldKey }: FieldId,
		idAllocator: IdAllocator,
		metadata: RebaseRevisionMetadata,
	): void {
		if (nodeId === undefined) {
			rebasedFields.set(fieldKey, rebasedField);
			return;
		}
		const rebasedNode = getFromChangeAtomIdMap(rebasedNodes, nodeId);
		if (rebasedNode !== undefined) {
			if (rebasedNode.fieldChanges === undefined) {
				rebasedNode.fieldChanges = new Map([[fieldKey, rebasedField]]);
				return;
			}

			assert(!rebasedNode.fieldChanges.has(fieldKey), "Expected an empty field");
			rebasedNode.fieldChanges.set(fieldKey, rebasedField);
			return;
		}

		const newNode: NodeChangeset = {
			fieldChanges: new Map([[fieldKey, rebasedField]]),
		};

		setInChangeAtomIdMap(rebasedNodes, nodeId, newNode);
		setInChangeAtomIdMap(table.baseToRebasedNodeId, nodeId, nodeId);

		const parentFieldId = getParentFieldId(table.baseChange, nodeId);

		this.attachRebasedNode(
			rebasedFields,
			rebasedNodes,
			table,
			nodeId,
			parentFieldId,
			idAllocator,
			metadata,
		);
	}

	private attachRebasedNode(
		rebasedFields: FieldChangeMap,
		rebasedNodes: ChangeAtomIdMap<NodeChangeset>,
		table: RebaseTable,
		baseNodeId: NodeId,
		parentFieldIdBase: FieldId,
		idAllocator: IdAllocator,
		metadata: RebaseRevisionMetadata,
	): void {
		const baseFieldChange = fieldChangeFromId(
			table.baseChange.fieldChanges,
			table.baseChange.nodeChanges,
			parentFieldIdBase,
		);

		const rebasedFieldId = rebasedFieldIdFromBaseId(table, parentFieldIdBase);
		setInChangeAtomIdMap(table.rebasedNodeToParent, baseNodeId, rebasedFieldId);

		const context = table.baseFieldToContext.get(baseFieldChange);
		if (context !== undefined) {
			// We've already processed this field.
			// The new child node can be attached when processing invalidated fields.
			context.baseNodeIds.push(baseNodeId);
			table.invalidatedFields.add(baseFieldChange);
			return;
		}

		const handler = getChangeHandler(this.fieldKinds, baseFieldChange.fieldKind);

		const fieldChange: FieldChange = {
			...baseFieldChange,
			change: brand(handler.createEmpty()),
		};

		const rebasedChangeset = handler.rebaser.rebase(
			handler.createEmpty(),
			baseFieldChange.change,
			(_idNew, idBase) =>
				idBase !== undefined && areEqualChangeAtomIds(idBase, baseNodeId)
					? baseNodeId
					: undefined,
			idAllocator,
			new RebaseManager(table, baseFieldChange, rebasedFieldId),
			metadata,
		);

		const rebasedField: FieldChange = { ...baseFieldChange, change: brand(rebasedChangeset) };
		table.rebasedFields.add(rebasedField);
		table.baseFieldToContext.set(baseFieldChange, {
			newChange: fieldChange,
			baseChange: baseFieldChange,
			rebasedChange: rebasedField,
			fieldId: rebasedFieldId,
			baseNodeIds: [],
		});

		this.attachRebasedField(
			rebasedFields,
			rebasedNodes,
			table,
			rebasedField,
			rebasedFieldId,
			idAllocator,
			metadata,
		);
	}

	private rebaseFieldMap(
		change: FieldChangeMap,
		over: FieldChangeMap,
		parentId: NodeId | undefined,
		genId: IdAllocator,
		crossFieldTable: RebaseTable,
		revisionMetadata: RebaseRevisionMetadata,
	): FieldChangeMap {
		const rebasedFields: FieldChangeMap = new Map();

		for (const [field, fieldChange] of change) {
			const fieldId: FieldId = { nodeId: parentId, field };
			const baseChange = over.get(field);
			if (baseChange === undefined) {
				rebasedFields.set(field, fieldChange);
				continue;
			}

			const {
				fieldKind,
				changeHandler,
				change1: fieldChangeset,
				change2: baseChangeset,
			} = this.normalizeFieldChanges(fieldChange, baseChange, genId, revisionMetadata);

			const manager = new RebaseManager(crossFieldTable, baseChange, fieldId);

			const rebaseChild = (
				child: NodeId | undefined,
				baseChild: NodeId | undefined,
				stateChange: NodeAttachState | undefined,
			): NodeId | undefined => {
				if (child !== undefined && baseChild !== undefined) {
					crossFieldTable.nodeIdPairs.push([child, baseChild, stateChange]);
				}
				return child;
			};

			const rebasedField = changeHandler.rebaser.rebase(
				fieldChangeset,
				baseChangeset,
				rebaseChild,
				genId,
				manager,
				revisionMetadata,
			);

			const rebasedFieldChange: FieldChange = {
				fieldKind,
				change: brand(rebasedField),
			};

			rebasedFields.set(field, rebasedFieldChange);

			crossFieldTable.baseFieldToContext.set(baseChange, {
				baseChange,
				newChange: fieldChange,
				rebasedChange: rebasedFieldChange,
				fieldId,
				baseNodeIds: [],
			});

			crossFieldTable.rebasedFields.add(rebasedFieldChange);
		}

		return rebasedFields;
	}

	private rebaseNodeChange(
		newId: NodeId,
		baseId: NodeId,
		genId: IdAllocator,
		crossFieldTable: RebaseTable,
		revisionMetadata: RebaseRevisionMetadata,
		constraintState: ConstraintState,
	): NodeChangeset {
		const change = nodeChangeFromId(crossFieldTable.newChange.nodeChanges, newId);
		const over = nodeChangeFromId(crossFieldTable.baseChange.nodeChanges, baseId);

		const baseMap: FieldChangeMap = over?.fieldChanges ?? new Map();

		const fieldChanges =
			change.fieldChanges !== undefined && over.fieldChanges !== undefined
				? this.rebaseFieldMap(
						change?.fieldChanges ?? new Map(),
						baseMap,
						newId,
						genId,
						crossFieldTable,
						revisionMetadata,
					)
				: change.fieldChanges;

		const rebasedChange: NodeChangeset = {};

		if (fieldChanges !== undefined && fieldChanges.size > 0) {
			rebasedChange.fieldChanges = fieldChanges;
		}

		if (change?.nodeExistsConstraint !== undefined) {
			rebasedChange.nodeExistsConstraint = change.nodeExistsConstraint;
		}

		setInChangeAtomIdMap(crossFieldTable.baseToRebasedNodeId, baseId, newId);
		return rebasedChange;
	}

	private updateConstraintsForFields(
		fields: FieldChangeMap,
		parentAttachState: NodeAttachState,
		constraintState: ConstraintState,
		nodes: ChangeAtomIdMap<NodeChangeset>,
	): void {
		for (const field of fields.values()) {
			const handler = getChangeHandler(this.fieldKinds, field.fieldKind);
			for (const [nodeId, index] of handler.getNestedChanges(field.change)) {
				const isDetached = index === undefined;
				const attachState =
					parentAttachState === NodeAttachState.Detached || isDetached
						? NodeAttachState.Detached
						: NodeAttachState.Attached;
				this.updateConstraintsForNode(nodeId, attachState, constraintState, nodes);
			}
		}
	}

	private updateConstraintsForNode(
		nodeId: NodeId,
		attachState: NodeAttachState,
		constraintState: ConstraintState,
		nodes: ChangeAtomIdMap<NodeChangeset>,
	): void {
		const node =
			tryGetFromNestedMap(nodes, nodeId.revision, nodeId.localId) ?? fail("Unknown node ID");

		if (node.nodeExistsConstraint !== undefined) {
			const isNowViolated = attachState === NodeAttachState.Detached;
			if (node.nodeExistsConstraint.violated !== isNowViolated) {
				node.nodeExistsConstraint = {
					...node.nodeExistsConstraint,
					violated: isNowViolated,
				};
				constraintState.violationCount += isNowViolated ? 1 : -1;
			}
		}

		if (node.fieldChanges !== undefined) {
			this.updateConstraintsForFields(node.fieldChanges, attachState, constraintState, nodes);
		}
	}

	private pruneFieldMap(
		changeset: FieldChangeMap | undefined,
		nodeMap: ChangeAtomIdMap<NodeChangeset>,
	): FieldChangeMap | undefined {
		if (changeset === undefined) {
			return undefined;
		}

		const prunedChangeset: FieldChangeMap = new Map();
		for (const [field, fieldChange] of changeset) {
			const handler = getChangeHandler(this.fieldKinds, fieldChange.fieldKind);

			const prunedFieldChangeset = handler.rebaser.prune(fieldChange.change, (nodeId) =>
				this.pruneNodeChange(nodeId, nodeMap),
			);

			if (!handler.isEmpty(prunedFieldChangeset)) {
				prunedChangeset.set(field, { ...fieldChange, change: brand(prunedFieldChangeset) });
			}
		}

		return prunedChangeset.size > 0 ? prunedChangeset : undefined;
	}

	private pruneNodeChange(
		nodeId: NodeId,
		nodeMap: ChangeAtomIdMap<NodeChangeset>,
	): NodeId | undefined {
		const changeset = nodeChangeFromId(nodeMap, nodeId);
		const prunedFields =
			changeset.fieldChanges !== undefined
				? this.pruneFieldMap(changeset.fieldChanges, nodeMap)
				: undefined;

		const prunedChange = { ...changeset, fieldChanges: prunedFields };
		if (prunedChange.fieldChanges === undefined) {
			delete prunedChange.fieldChanges;
		}

		if (isEmptyNodeChangeset(prunedChange)) {
			deleteFromNestedMap(nodeMap, nodeId.revision, nodeId.localId);
			return undefined;
		} else {
			setInChangeAtomIdMap(nodeMap, nodeId, prunedChange);
			return nodeId;
		}
	}

	public changeRevision(
		change: ModularChangeset,
		newRevision: RevisionTag | undefined,
		rollbackOf?: RevisionTag,
	): ModularChangeset {
		const oldRevisions = new Set(
			change.revisions === undefined
				? [undefined]
				: change.revisions.map((revInfo) => revInfo.revision),
		);
		const updatedFields = this.replaceFieldMapRevisions(
			change.fieldChanges,
			oldRevisions,
			newRevision,
		);

		const updatedNodes: ChangeAtomIdMap<NodeChangeset> = nestedMapFromFlatList(
			nestedMapToFlatList(change.nodeChanges).map(([revision, id, nodeChangeset]) => [
				replaceRevision(revision, oldRevisions, newRevision),
				id,
				this.replaceNodeChangesetRevisions(nodeChangeset, oldRevisions, newRevision),
			]),
		);

		const updatedNodeToParent: ChangeAtomIdMap<FieldId> = nestedMapFromFlatList(
			nestedMapToFlatList(change.nodeToParent).map(([revision, id, fieldId]) => [
				replaceRevision(revision, oldRevisions, newRevision),
				id,
				replaceFieldIdRevision(
					normalizeFieldId(fieldId, change.nodeAliases),
					oldRevisions,
					newRevision,
				),
			]),
		);

		const updated: Mutable<ModularChangeset> = {
			...change,
			fieldChanges: updatedFields,
			nodeChanges: updatedNodes,
			nodeToParent: updatedNodeToParent,

			// We've updated all references to old node IDs, so we no longer need an alias table.
			nodeAliases: new Map(),
			crossFieldKeys: replaceCrossFieldKeyTableRevisions(
				change.crossFieldKeys,
				oldRevisions,
				newRevision,
				change.nodeAliases,
			),
		};

		if (change.builds !== undefined) {
			updated.builds = replaceIdMapRevisions(change.builds, oldRevisions, newRevision);
		}

		if (change.destroys !== undefined) {
			updated.destroys = replaceIdMapRevisions(change.destroys, oldRevisions, newRevision);
		}

		if (change.refreshers !== undefined) {
			updated.refreshers = replaceIdMapRevisions(change.refreshers, oldRevisions, newRevision);
		}

		if (newRevision !== undefined) {
			const revInfo: Mutable<RevisionInfo> = { revision: newRevision };
			if (rollbackOf !== undefined) {
				revInfo.rollbackOf = rollbackOf;
			}

			updated.revisions = [revInfo];
		} else {
			delete updated.revisions;
		}

		return updated;
	}

	private replaceNodeChangesetRevisions(
		nodeChangeset: NodeChangeset,
		oldRevisions: Set<RevisionTag | undefined>,
		newRevision: RevisionTag | undefined,
	): NodeChangeset {
		const updated = { ...nodeChangeset };
		if (nodeChangeset.fieldChanges !== undefined) {
			updated.fieldChanges = this.replaceFieldMapRevisions(
				nodeChangeset.fieldChanges,
				oldRevisions,
				newRevision,
			);
		}

		return updated;
	}

	private replaceFieldMapRevisions(
		fields: FieldChangeMap,
		oldRevisions: Set<RevisionTag | undefined>,
		newRevision: RevisionTag | undefined,
	): FieldChangeMap {
		const updatedFields: FieldChangeMap = new Map();
		for (const [field, fieldChange] of fields) {
			const updatedFieldChange = getChangeHandler(
				this.fieldKinds,
				fieldChange.fieldKind,
			).rebaser.replaceRevisions(fieldChange.change, oldRevisions, newRevision);

			updatedFields.set(field, { ...fieldChange, change: brand(updatedFieldChange) });
		}

		return updatedFields;
	}

	private makeCrossFieldKeyTable(
		fields: FieldChangeMap,
		nodes: ChangeAtomIdMap<NodeChangeset>,
	): CrossFieldKeyTable {
		const keys: CrossFieldKeyTable = newCrossFieldKeyTable();
		this.populateCrossFieldKeyTableForFieldMap(keys, fields, undefined);
		forEachInNestedMap(nodes, (node, revision, localId) => {
			if (node.fieldChanges !== undefined) {
				this.populateCrossFieldKeyTableForFieldMap(keys, node.fieldChanges, {
					revision,
					localId,
				});
			}
		});

		return keys;
	}

	private populateCrossFieldKeyTableForFieldMap(
		table: CrossFieldKeyTable,
		fields: FieldChangeMap,
		parent: NodeId | undefined,
	): void {
		for (const [fieldKey, fieldChange] of fields) {
			const keys = getChangeHandler(this.fieldKinds, fieldChange.fieldKind).getCrossFieldKeys(
				fieldChange.change,
			);
			for (const key of keys) {
				table.set(key, { nodeId: parent, field: fieldKey });
			}
		}
	}

	public buildEditor(changeReceiver: (change: ModularChangeset) => void): ModularEditBuilder {
		return new ModularEditBuilder(this, this.fieldKinds, changeReceiver);
	}

	private createEmptyFieldChange(fieldKind: FieldKindIdentifier): FieldChange {
		const emptyChange = getChangeHandler(this.fieldKinds, fieldKind).createEmpty();
		return { fieldKind, change: brand(emptyChange) };
	}
}

function replaceCrossFieldKeyTableRevisions(
	table: CrossFieldKeyTable,
	oldRevisions: Set<RevisionTag | undefined>,
	newRevision: RevisionTag | undefined,
	nodeAliases: ChangeAtomIdMap<NodeId>,
): CrossFieldKeyTable {
	const updated: CrossFieldKeyTable = newBTree();
	table.forEachPair(([target, revision, id, count], field) => {
		const updatedKey: CrossFieldKeyRange = [
			target,
			replaceRevision(revision, oldRevisions, newRevision),
			id,
			count,
		];

		const normalizedFieldId = normalizeFieldId(field, nodeAliases);
		const updatedNodeId =
			normalizedFieldId.nodeId !== undefined
				? replaceAtomRevisions(normalizedFieldId.nodeId, oldRevisions, newRevision)
				: undefined;

		const updatedValue: FieldId = {
			...normalizedFieldId,
			nodeId: updatedNodeId,
		};

		updated.set(updatedKey, updatedValue);
	});

	return updated;
}

function replaceRevision(
	revision: RevisionTag | undefined,
	oldRevisions: Set<RevisionTag | undefined>,
	newRevision: RevisionTag | undefined,
): RevisionTag | undefined {
	return oldRevisions.has(revision) ? newRevision : revision;
}

function replaceIdMapRevisions<T>(
	map: ChangeAtomIdMap<T>,
	oldRevisions: Set<RevisionTag | undefined>,
	newRevision: RevisionTag | undefined,
): ChangeAtomIdMap<T> {
	return nestedMapFromFlatList(
		nestedMapToFlatList(map).map(([revision, id, value]) => [
			replaceRevision(revision, oldRevisions, newRevision),
			id,
			value,
		]),
	);
}

interface BuildsDestroysAndRefreshers {
	readonly allBuilds: ChangeAtomIdMap<TreeChunk>;
	readonly allDestroys: ChangeAtomIdMap<number>;
	readonly allRefreshers: ChangeAtomIdMap<TreeChunk>;
}

function composeBuildsDestroysAndRefreshers(
	changes: TaggedChange<ModularChangeset>[],
): BuildsDestroysAndRefreshers {
	const allBuilds: ChangeAtomIdMap<TreeChunk> = new Map();
	const allDestroys: ChangeAtomIdMap<number> = new Map();
	const allRefreshers: ChangeAtomIdMap<TreeChunk> = new Map();
	for (const taggedChange of changes) {
		const revision = revisionFromTaggedChange(taggedChange);
		const change = taggedChange.change;
		if (change.builds) {
			for (const [revisionKey, innerMap] of change.builds) {
				const setRevisionKey = revisionKey ?? revision;
				const innerDstMap = getOrAddInMap(
					allBuilds,
					setRevisionKey,
					new Map<ChangesetLocalId, TreeChunk>(),
				);
				for (const [id, chunk] of innerMap) {
					// Check for duplicate builds and prefer earlier ones.
					// This can happen in compositions of commits that needed to include detached tree refreshers (e.g., undos):
					// In that case, it's possible for the refreshers to contain different trees because the latter
					// refresher may already reflect the changes made by the commit that includes the earlier
					// refresher. This composition includes the changes made by the commit that includes the
					// earlier refresher, so we need to include the build for the earlier refresher, otherwise
					// the produced changeset will build a tree one which those changes have already been applied
					// and also try to apply the changes again, effectively applying them twice.
					// Note that it would in principle be possible to adopt the later build and exclude from the
					// composition all the changes already reflected on the tree, but that is not something we
					// care to support at this time.
					if (!innerDstMap.has(id)) {
						// Check for earlier destroys that this build might cancel-out with.
						const destroyCount = tryGetFromNestedMap(allDestroys, setRevisionKey, id);
						if (destroyCount === undefined) {
							innerDstMap.set(id, chunk);
						} else {
							assert(
								destroyCount === chunk.topLevelLength,
								0x89b /* Expected build and destroy to have the same length */,
							);
							deleteFromNestedMap(allDestroys, setRevisionKey, id);
						}
					}
				}
				if (innerDstMap.size === 0) {
					allBuilds.delete(setRevisionKey);
				}
			}
		}
		if (change.destroys !== undefined) {
			for (const [revisionKey, innerMap] of change.destroys) {
				const setRevisionKey = revisionKey ?? revision;
				const innerDstMap = getOrAddInMap(
					allDestroys,
					setRevisionKey,
					new Map<ChangesetLocalId, number>(),
				);
				for (const [id, count] of innerMap) {
					// Check for earlier builds that this destroy might cancel-out with.
					const chunk = tryGetFromNestedMap(allBuilds, setRevisionKey, id);
					if (chunk === undefined) {
						innerDstMap.set(id, count);
					} else {
						assert(
							count === chunk.topLevelLength,
							0x89c /* Expected build and destroy to have the same length */,
						);
						deleteFromNestedMap(allBuilds, setRevisionKey, id);
					}
				}
				if (innerDstMap.size === 0) {
					allDestroys.delete(setRevisionKey);
				}
			}
		}
		// add all refreshers while preferring earlier ones
		if (change.refreshers) {
			populateNestedMap(change.refreshers, allRefreshers, false);
		}
	}
	return { allBuilds, allDestroys, allRefreshers };
}

function invertBuilds(
	builds: ChangeAtomIdMap<TreeChunk> | undefined,
	fallbackRevision: RevisionTag | undefined,
): ChangeAtomIdMap<number> | undefined {
	if (builds !== undefined) {
		const destroys: ChangeAtomIdMap<number> = new Map();
		for (const [revision, innerBuildMap] of builds) {
			const initializedRevision = revision ?? fallbackRevision;
			const innerDestroyMap: Map<ChangesetLocalId, number> = new Map();
			for (const [id, chunk] of innerBuildMap) {
				innerDestroyMap.set(id, chunk.topLevelLength);
			}
			destroys.set(initializedRevision, innerDestroyMap);
		}
		return destroys;
	}
	return undefined;
}

/**
 * Returns the set of removed roots that should be in memory for the given change to be applied.
 * A removed root is relevant if any of the following is true:
 * - It is being inserted
 * - It is being restored
 * - It is being edited
 * - The ID it is associated with is being changed
 *
 * May be conservative by returning more removed roots than strictly necessary.
 *
 * Will never return IDs for non-root trees, even if they are removed.
 *
 * @param change - The change to be applied.
 * @param fieldKinds - The field kinds to delegate to.
 */
export function* relevantRemovedRoots(
	change: ModularChangeset,
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
): Iterable<DeltaDetachedNodeId> {
	yield* relevantRemovedRootsFromFields(change.fieldChanges, change.nodeChanges, fieldKinds);
}

function* relevantRemovedRootsFromFields(
	change: FieldChangeMap,
	nodeChanges: ChangeAtomIdMap<NodeChangeset>,
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
): Iterable<DeltaDetachedNodeId> {
	for (const [_, fieldChange] of change) {
		const handler = getChangeHandler(fieldKinds, fieldChange.fieldKind);
		const delegate = function* (node: NodeId): Iterable<DeltaDetachedNodeId> {
			const nodeChangeset = nodeChangeFromId(nodeChanges, node);
			if (nodeChangeset.fieldChanges !== undefined) {
				yield* relevantRemovedRootsFromFields(
					nodeChangeset.fieldChanges,
					nodeChanges,
					fieldKinds,
				);
			}
		};
		yield* handler.relevantRemovedRoots(fieldChange.change, delegate);
	}
}

/**
 * Adds any refreshers missing from the provided change that are relevant to the change and
 * removes any refreshers from the provided change that are not relevant to the change.
 *
 * @param change - The change that possibly has missing or superfluous refreshers. Not mutated by this function.
 * @param getDetachedNode - The function to retrieve a tree chunk from the corresponding detached node id.
 * @param removedRoots - The set of removed roots that should be in memory for the given change to be applied.
 * Can be retrieved by calling {@link relevantRemovedRoots}.
 * @param requireRefreshers - when true, this function enforces that all relevant removed roots have a
 * corresponding build or refresher.
 */
export function updateRefreshers(
	change: ModularChangeset,
	getDetachedNode: (id: DeltaDetachedNodeId) => TreeChunk | undefined,
	removedRoots: Iterable<DeltaDetachedNodeId>,
	requireRefreshers: boolean = true,
): ModularChangeset {
	const refreshers: ChangeAtomIdMap<TreeChunk> = new Map();
	const chunkLengths: Map<RevisionTag | undefined, BTree<number, number>> = new Map();

	if (change.builds !== undefined) {
		for (const [major, buildsMap] of change.builds) {
			const lengthTree = getOrAddInMap(chunkLengths, major, new BTree());
			for (const [id, chunk] of buildsMap) {
				lengthTree.set(id, chunk.topLevelLength);
			}
		}
	}

	for (const root of removedRoots) {
		if (change.builds !== undefined) {
			const lengthTree = chunkLengths.get(root.major);

			if (lengthTree !== undefined) {
				const lengthPair = lengthTree.getPairOrNextLower(root.minor);
				if (lengthPair !== undefined) {
					const [firstMinor, length] = lengthPair;

					// if the root minor is within the length of the minor of the retrieved pair
					// then there's no need to check for the detached node
					if (root.minor < firstMinor + length) {
						continue;
					}
				}
			}
		}

		const node = getDetachedNode(root);
		if (node === undefined) {
			assert(!requireRefreshers, 0x8cd /* detached node should exist */);
		} else {
			setInNestedMap(refreshers, root.major, root.minor, node);
		}
	}

	const {
		fieldChanges,
		nodeChanges,
		maxId,
		revisions,
		constraintViolationCount,
		builds,
		destroys,
	} = change;

	return makeModularChangeset(
		fieldChanges,
		nodeChanges,
		change.nodeToParent,
		change.nodeAliases,
		change.crossFieldKeys,
		maxId,
		revisions,
		constraintViolationCount,
		builds,
		destroys,
		refreshers,
	);
}

/**
 * @param change - The change to convert into a delta.
 * @param fieldKinds - The field kinds to delegate to.
 */
export function intoDelta(
	taggedChange: TaggedChange<ModularChangeset>,
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
): DeltaRoot {
	const change = taggedChange.change;
	const idAllocator = MemoizedIdRangeAllocator.fromNextId();
	const rootDelta: Mutable<DeltaRoot> = {};

	if ((change.constraintViolationCount ?? 0) === 0) {
		// If there are no constraint violations, then tree changes apply.
		const fieldDeltas = intoDeltaImpl(
			change.fieldChanges,
			change.nodeChanges,
			idAllocator,
			fieldKinds,
		);
		if (fieldDeltas.size > 0) {
			rootDelta.fields = fieldDeltas;
		}
	}

	// Constraint violations should not prevent nodes from being built
	if (change.builds && change.builds.size > 0) {
		rootDelta.build = copyDetachedNodes(change.builds);
	}
	if (change.destroys !== undefined && change.destroys.size > 0) {
		const destroys: DeltaDetachedNodeDestruction[] = [];
		forEachInNestedMap(change.destroys, (count, major, minor) => {
			destroys.push({
				id: makeDetachedNodeId(major, minor),
				count,
			});
		});
		rootDelta.destroy = destroys;
	}
	if (change.refreshers && change.refreshers.size > 0) {
		rootDelta.refreshers = copyDetachedNodes(change.refreshers);
	}
	return rootDelta;
}

function copyDetachedNodes(
	detachedNodes: ChangeAtomIdMap<TreeChunk>,
): DeltaDetachedNodeBuild[] | undefined {
	const copiedDetachedNodes: DeltaDetachedNodeBuild[] = [];
	forEachInNestedMap(detachedNodes, (chunk, major, minor) => {
		if (chunk.topLevelLength > 0) {
			const trees = mapCursorField(chunk.cursor(), (c) =>
				cursorForMapTreeNode(mapTreeFromCursor(c)),
			);
			copiedDetachedNodes.push({
				id: makeDetachedNodeId(major, minor),
				trees,
			});
		}
	});
	return copiedDetachedNodes.length > 0 ? copiedDetachedNodes : undefined;
}

/**
 * @param change - The change to convert into a delta.
 */
function intoDeltaImpl(
	change: FieldChangeMap,
	nodeChanges: ChangeAtomIdMap<NodeChangeset>,
	idAllocator: MemoizedIdRangeAllocator,
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
): Map<FieldKey, DeltaFieldChanges> {
	const delta: Map<FieldKey, DeltaFieldChanges> = new Map();
	for (const [field, fieldChange] of change) {
		const deltaField = getChangeHandler(fieldKinds, fieldChange.fieldKind).intoDelta(
			fieldChange.change,
			(childChange): DeltaFieldMap => {
				const nodeChange = nodeChangeFromId(nodeChanges, childChange);
				return deltaFromNodeChange(nodeChange, nodeChanges, idAllocator, fieldKinds);
			},
			idAllocator,
		);
		if (!isEmptyFieldChanges(deltaField)) {
			delta.set(field, deltaField);
		}
	}
	return delta;
}

function deltaFromNodeChange(
	change: NodeChangeset,
	nodeChanges: ChangeAtomIdMap<NodeChangeset>,
	idAllocator: MemoizedIdRangeAllocator,
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
): DeltaFieldMap {
	if (change.fieldChanges !== undefined) {
		return intoDeltaImpl(change.fieldChanges, nodeChanges, idAllocator, fieldKinds);
	}
	// TODO: update the API to allow undefined to be returned here
	return new Map();
}

/**
 * @internal
 * @param revInfos - This should describe the revision being rebased and all revisions in the rebase path,
 * even if not part of the current base changeset.
 * For example, when rebasing change B from a local branch [A, B, C] over a branch [X, Y], the `revInfos` must include
 * the changes [A⁻¹ X, Y, A, B] for each rebase step of B.
 * @param revisionToRebase - The revision of the changeset which is being rebased.
 * @param baseRevisions - The set of revisions in the changeset being rebased over.
 * For example, when rebasing change B from a local branch [A, B, C] over a branch [X, Y], the `baseRevisions` must include
 * revisions [A⁻¹ X, Y, A] if rebasing over the composition of all those changes, or
 * revision [A⁻¹] for the first rebase, then [X], etc. if rebasing over edits individually.
 * @returns - RebaseRevisionMetadata to be passed to `FieldChangeRebaser.rebase`*
 */
export function rebaseRevisionMetadataFromInfo(
	revInfos: readonly RevisionInfo[],
	revisionToRebase: RevisionTag | undefined,
	baseRevisions: (RevisionTag | undefined)[],
): RebaseRevisionMetadata {
	const filteredRevisions: RevisionTag[] = [];
	for (const revision of baseRevisions) {
		if (revision !== undefined) {
			filteredRevisions.push(revision);
		}
	}

	const getBaseRevisions = (): RevisionTag[] => filteredRevisions;
	return {
		...revisionMetadataSourceFromInfo(revInfos),
		getRevisionToRebase: () => revisionToRebase,
		getBaseRevisions,
	};
}

function isEmptyNodeChangeset(change: NodeChangeset): boolean {
	return change.fieldChanges === undefined && change.nodeExistsConstraint === undefined;
}

export function getFieldKind(
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
	kind: FieldKindIdentifier,
): FieldKindWithEditor {
	if (kind === genericFieldKind.identifier) {
		return genericFieldKind;
	}
	const fieldKind = fieldKinds.get(kind);
	assert(fieldKind !== undefined, 0x3ad /* Unknown field kind */);
	return withEditor(fieldKind);
}

export function getChangeHandler(
	fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
	kind: FieldKindIdentifier,
): FieldChangeHandler<unknown> {
	return getFieldKind(fieldKinds, kind).changeHandler;
}

// TODO: TFieldData could instead just be a numeric ID generated by the CrossFieldTable
// The CrossFieldTable could have a generic field ID to context table
interface CrossFieldTable<TFieldData> {
	srcTable: CrossFieldMap<unknown>;
	dstTable: CrossFieldMap<unknown>;
	srcDependents: CrossFieldMap<TFieldData>;
	dstDependents: CrossFieldMap<TFieldData>;
	invalidatedFields: Set<TFieldData>;
}

interface InvertTable extends CrossFieldTable<FieldChange> {
	originalFieldToContext: Map<FieldChange, InvertContext>;
	invertedNodeToParent: ChangeAtomIdMap<FieldId>;
}

interface InvertContext {
	fieldId: FieldId;
	invertedField: FieldChange;
}

interface RebaseTable extends CrossFieldTable<FieldChange> {
	readonly baseChange: ModularChangeset;
	readonly newChange: ModularChangeset;

	/**
	 * Maps from the FieldChange key used for the CrossFieldTable (which is the base FieldChange)
	 * to the context for the field.
	 */
	readonly baseFieldToContext: Map<FieldChange, RebaseFieldContext>;
	readonly baseToRebasedNodeId: ChangeAtomIdMap<NodeId>;
	readonly rebasedFields: Set<FieldChange>;
	readonly rebasedNodeToParent: ChangeAtomIdMap<FieldId>;
	readonly rebasedCrossFieldKeys: CrossFieldKeyTable;

	/**
	 * List of (newId, baseId) pairs encountered so far.
	 */
	readonly nodeIdPairs: [NodeId, NodeId, NodeAttachState | undefined][];

	readonly affectedNewFields: TupleBTree<FieldIdKey, boolean>;
	readonly affectedBaseFields: TupleBTree<FieldIdKey, boolean>;
}

type FieldIdKey = [RevisionTag | undefined, ChangesetLocalId | undefined, FieldKey];

interface RebaseFieldContext {
	baseChange: FieldChange;
	newChange: FieldChange;
	rebasedChange: FieldChange;
	fieldId: FieldId;

	/**
	 * The set of node IDs in the base changeset which should be included in the rebased field,
	 * even if there is no corresponding node changeset in the new change.
	 */
	baseNodeIds: NodeId[];
}

function newComposeTable(
	baseChange: ModularChangeset,
	newChange: ModularChangeset,
): ComposeTable {
	return {
		...newCrossFieldTable<FieldChange>(),
		baseChange,
		newChange,
		fieldToContext: new Map(),
		newFieldToBaseField: new Map(),
		newToBaseNodeId: new Map(),
		composedNodes: new Set(),
		pendingCompositions: {
			nodeIdsToCompose: [],
			affectedBaseFields: newBTree(),
			affectedNewFields: newBTree(),
		},
	};
}

interface ComposeTable extends CrossFieldTable<FieldChange> {
	readonly baseChange: ModularChangeset;
	readonly newChange: ModularChangeset;

	/**
	 * Maps from an input changeset for a field (from change1 if it has one, from change2 otherwise) to the context for that field.
	 */
	readonly fieldToContext: Map<FieldChange, ComposeFieldContext>;
	readonly newFieldToBaseField: Map<FieldChange, FieldChange>;
	readonly newToBaseNodeId: ChangeAtomIdMap<NodeId>;
	readonly composedNodes: Set<NodeChangeset>;
	readonly pendingCompositions: PendingCompositions;
}

interface PendingCompositions {
	/**
	 * Each entry in this list represents a node with both base and new changes which have not yet been composed.
	 * Entries are of the form [baseId, newId].
	 */
	readonly nodeIdsToCompose: [NodeId, NodeId][];

	/**
	 * The set of fields in the base changeset which have been affected by a cross field effect.
	 */
	readonly affectedBaseFields: BTree<FieldIdKey, true>;

	/**
	 * The set of fields in the new changeset which have been affected by a cross field effect.
	 */
	readonly affectedNewFields: BTree<FieldIdKey, true>;
}

interface ComposeFieldContext {
	change1: FieldChangeset;
	change2: FieldChangeset;
	composedChange: FieldChange;
}

function newCrossFieldTable<T>(): CrossFieldTable<T> {
	return {
		srcTable: new Map(),
		dstTable: new Map(),
		srcDependents: new Map(),
		dstDependents: new Map(),
		invalidatedFields: new Set(),
	};
}

/**
 * @internal
 */
interface ConstraintState {
	violationCount: number;
}

function newConstraintState(violationCount: number): ConstraintState {
	return {
		violationCount,
	};
}

abstract class CrossFieldManagerI<T> implements CrossFieldManager {
	public constructor(
		protected readonly crossFieldTable: CrossFieldTable<T>,
		private readonly currentFieldKey: T,
		protected readonly allowInval = true,
	) {}

	public set(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
		newValue: unknown,
		invalidateDependents: boolean,
	): void {
		if (invalidateDependents && this.allowInval) {
			const lastChangedId = (id as number) + count - 1;
			let firstId = id;
			while (firstId <= lastChangedId) {
				const dependentEntry = getFirstFromCrossFieldMap(
					this.getDependents(target),
					revision,
					firstId,
					lastChangedId - firstId + 1,
				);
				if (dependentEntry.value !== undefined) {
					this.crossFieldTable.invalidatedFields.add(dependentEntry.value);
				}

				firstId = brand(firstId + dependentEntry.length);
			}
		}
		setInCrossFieldMap(this.getMap(target), revision, id, count, newValue);
	}

	public get(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
		addDependency: boolean,
	): RangeQueryResult<unknown> {
		if (addDependency) {
			// We assume that if there is already an entry for this ID it is because
			// a field handler has called compose on the same node multiple times.
			// In this case we only want to update the latest version, so we overwrite the dependency.
			setInCrossFieldMap(
				this.getDependents(target),
				revision,
				id,
				count,
				this.currentFieldKey,
			);
		}
		return getFirstFromCrossFieldMap(this.getMap(target), revision, id, count);
	}

	public abstract moveNode(id: NodeId): void;

	public abstract moveKey(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
	): void;

	private getMap(target: CrossFieldTarget): CrossFieldMap<unknown> {
		return target === CrossFieldTarget.Source
			? this.crossFieldTable.srcTable
			: this.crossFieldTable.dstTable;
	}

	private getDependents(target: CrossFieldTarget): CrossFieldMap<T> {
		return target === CrossFieldTarget.Source
			? this.crossFieldTable.srcDependents
			: this.crossFieldTable.dstDependents;
	}
}

class InvertManager extends CrossFieldManagerI<FieldChange> {
	public constructor(
		table: InvertTable,
		field: FieldChange,
		private readonly fieldId: FieldId,
		allowInval = true,
	) {
		super(table, field, allowInval);
	}

	public override moveNode(id: ChangeAtomId): void {
		setInChangeAtomIdMap(this.table.invertedNodeToParent, id, this.fieldId);
	}

	public override moveKey(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
	): void {
		throw new Error("Method not implemented.");
	}

	private get table(): InvertTable {
		return this.crossFieldTable as InvertTable;
	}
}

class RebaseManager extends CrossFieldManagerI<FieldChange> {
	public constructor(
		table: RebaseTable,
		currentField: FieldChange,
		private readonly fieldId: FieldId,
		allowInval = true,
	) {
		super(table, currentField, allowInval);
	}

	public override set(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
		newValue: unknown,
		invalidateDependents: boolean,
	): void {
		if (invalidateDependents && this.allowInval) {
			const newFieldIds = getFieldsForCrossFieldKey(this.table.newChange, [
				target,
				revision,
				id,
				count,
			]);

			if (newFieldIds.length > 0) {
				for (const newFieldId of newFieldIds) {
					this.table.affectedNewFields.set(
						[newFieldId.nodeId?.revision, newFieldId.nodeId?.localId, newFieldId.field],
						true,
					);
				}
			} else {
				const baseFieldIds = getFieldsForCrossFieldKey(this.table.baseChange, [
					target,
					revision,
					id,
					count,
				]);

				assert(
					baseFieldIds.length > 0,
					"Cross field key not registered in base or new change",
				);

				for (const baseFieldId of baseFieldIds) {
					this.table.affectedBaseFields.set(
						[baseFieldId.nodeId?.revision, baseFieldId.nodeId?.localId, baseFieldId.field],
						true,
					);
				}
			}
		}

		super.set(target, revision, id, count, newValue, invalidateDependents);
	}

	public override moveNode(id: ChangeAtomId): void {
		setInChangeAtomIdMap(this.table.rebasedNodeToParent, id, this.fieldId);
	}

	public override moveKey(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
	): void {
		setInCrossFieldKeyTable(
			this.table.rebasedCrossFieldKeys,
			target,
			revision,
			id,
			count,
			this.fieldId,
		);
	}

	private get table(): RebaseTable {
		return this.crossFieldTable as RebaseTable;
	}
}

// TODO: Deduplicate this with RebaseTable
class ComposeManager extends CrossFieldManagerI<FieldChange> {
	public constructor(table: ComposeTable, currentField: FieldChange, allowInval = true) {
		super(table, currentField, allowInval);
	}

	public override set(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
		newValue: unknown,
		invalidateDependents: boolean,
	): void {
		if (invalidateDependents && this.allowInval) {
			const newFieldIds = getFieldsForCrossFieldKey(this.table.newChange, [
				target,
				revision,
				id,
				count,
			]);

			if (newFieldIds.length > 0) {
				for (const newFieldId of newFieldIds) {
					this.table.pendingCompositions.affectedNewFields.set(
						[newFieldId.nodeId?.revision, newFieldId.nodeId?.localId, newFieldId.field],
						true,
					);
				}
			} else {
				const baseFieldIds = getFieldsForCrossFieldKey(this.table.baseChange, [
					target,
					revision,
					id,
					count,
				]);

				assert(
					baseFieldIds.length > 0,
					"Cross field key not registered in base or new change",
				);

				for (const baseFieldId of baseFieldIds) {
					this.table.pendingCompositions.affectedBaseFields.set(
						[baseFieldId.nodeId?.revision, baseFieldId.nodeId?.localId, baseFieldId.field],
						true,
					);
				}
			}
		}

		super.set(target, revision, id, count, newValue, invalidateDependents);
	}

	public override moveNode(id: ChangeAtomId): void {
		throw new Error("Method not implemented.");
	}
	public override moveKey(
		target: CrossFieldTarget,
		revision: RevisionTag | undefined,
		id: ChangesetLocalId,
		count: number,
	): void {
		throw new Error("Method not implemented.");
	}

	private get table(): ComposeTable {
		return this.crossFieldTable as ComposeTable;
	}
}

function makeModularChangeset(
	fieldChanges: FieldChangeMap | undefined = undefined,
	nodeChanges: ChangeAtomIdMap<NodeChangeset> | undefined = undefined,
	nodeToParent: ChangeAtomIdMap<FieldId> | undefined = undefined,
	nodeAliases: ChangeAtomIdMap<NodeId> | undefined = undefined,
	crossFieldKeys: CrossFieldKeyTable | undefined = undefined,
	maxId: number = -1,
	revisions: readonly RevisionInfo[] | undefined = undefined,
	constraintViolationCount: number | undefined = undefined,
	builds?: ChangeAtomIdMap<TreeChunk>,
	destroys?: ChangeAtomIdMap<number>,
	refreshers?: ChangeAtomIdMap<TreeChunk>,
): ModularChangeset {
	const changeset: Mutable<ModularChangeset> = {
		fieldChanges: fieldChanges ?? new Map(),
		nodeChanges: nodeChanges ?? new Map(),
		nodeToParent: nodeToParent ?? new Map(),
		nodeAliases: nodeAliases ?? new Map(),
		crossFieldKeys: crossFieldKeys ?? newCrossFieldKeyTable(),
	};

	if (revisions !== undefined && revisions.length > 0) {
		changeset.revisions = revisions;
	}
	if (maxId >= 0) {
		changeset.maxId = brand(maxId);
	}
	if (constraintViolationCount !== undefined && constraintViolationCount > 0) {
		changeset.constraintViolationCount = constraintViolationCount;
	}
	if (builds !== undefined && builds.size > 0) {
		changeset.builds = builds;
	}
	if (destroys !== undefined && destroys.size > 0) {
		changeset.destroys = destroys;
	}
	if (refreshers !== undefined && refreshers.size > 0) {
		changeset.refreshers = refreshers;
	}
	return changeset;
}

export class ModularEditBuilder extends EditBuilder<ModularChangeset> {
	private transactionDepth: number = 0;
	private idAllocator: IdAllocator;

	public constructor(
		family: ChangeFamily<ChangeFamilyEditor, ModularChangeset>,
		private readonly fieldKinds: ReadonlyMap<FieldKindIdentifier, FieldKindWithEditor>,
		changeReceiver: (change: ModularChangeset) => void,
	) {
		super(family, changeReceiver);
		this.idAllocator = idAllocatorFromMaxId();
	}

	public override enterTransaction(): void {
		this.transactionDepth += 1;
		if (this.transactionDepth === 1) {
			this.idAllocator = idAllocatorFromMaxId();
		}
	}

	public override exitTransaction(): void {
		assert(this.transactionDepth > 0, 0x5b9 /* Cannot exit inexistent transaction */);
		this.transactionDepth -= 1;
		if (this.transactionDepth === 0) {
			this.idAllocator = idAllocatorFromMaxId();
		}
	}

	/**
	 * @param firstId - The ID to associate with the first node
	 * @param content - The node(s) to build. Can be in either Field or Node mode.
	 * @returns A description of the edit that can be passed to `submitChanges`.
	 */
	public buildTrees(
		firstId: ChangesetLocalId,
		content: ITreeCursorSynchronous,
	): GlobalEditDescription {
		if (content.mode === CursorLocationType.Fields && content.getFieldLength() === 0) {
			return { type: "global" };
		}
		const builds: ChangeAtomIdMap<TreeChunk> = new Map();
		const innerMap = new Map();
		builds.set(undefined, innerMap);
		const chunk =
			content.mode === CursorLocationType.Fields
				? chunkFieldSingle(content, defaultChunkPolicy)
				: chunkTree(content, defaultChunkPolicy);
		innerMap.set(firstId, chunk);

		return {
			type: "global",
			builds,
		};
	}

	/**
	 * Adds a change to the edit builder
	 * @param field - the field which is being edited
	 * @param fieldKind - the kind of the field
	 * @param change - the change to the field
	 * @param maxId - the highest `ChangesetLocalId` used in this change
	 */
	public submitChange(
		field: FieldUpPath,
		fieldKind: FieldKindIdentifier,
		change: FieldChangeset,
	): void {
		const crossFieldKeys = getChangeHandler(this.fieldKinds, fieldKind).getCrossFieldKeys(
			change,
		);

		const modularChange = buildModularChangesetFromField(
			field,
			{ fieldKind, change },
			new Map(),
			new Map(),
			newCrossFieldKeyTable(),
			this.idAllocator,
			crossFieldKeys,
		);
		this.applyChange(modularChange);
	}

	public submitChanges(changes: EditDescription[]): void {
		const modularChange = this.buildChanges(changes);
		this.applyChange(modularChange);
	}

	public buildChanges(changes: EditDescription[]): ModularChangeset {
		const changeMaps = changes.map((change) =>
			makeAnonChange(
				change.type === "global"
					? makeModularChangeset(
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
							this.idAllocator.getMaxId(),
							undefined,
							undefined,
							change.builds,
						)
					: buildModularChangesetFromField(
							change.field,
							{
								fieldKind: change.fieldKind,
								change: change.change,
							},
							new Map(),
							new Map(),
							newCrossFieldKeyTable(),
							this.idAllocator,
							getChangeHandler(this.fieldKinds, change.fieldKind).getCrossFieldKeys(
								change.change,
							),
						),
			),
		);
		const composedChange: Mutable<ModularChangeset> =
			this.changeFamily.rebaser.compose(changeMaps);

		const maxId: ChangesetLocalId = brand(this.idAllocator.getMaxId());
		if (maxId >= 0) {
			composedChange.maxId = maxId;
		}
		return composedChange;
	}

	public generateId(count?: number): ChangesetLocalId {
		return brand(this.idAllocator.allocate(count));
	}

	public addNodeExistsConstraint(path: UpPath): void {
		const nodeChange: NodeChangeset = {
			nodeExistsConstraint: { violated: false },
		};

		this.applyChange(
			buildModularChangesetFromNode(
				path,
				nodeChange,
				new Map(),
				new Map(),
				newCrossFieldKeyTable(),
				this.idAllocator,
			),
		);
	}
}

function buildModularChangesetFromField(
	path: FieldUpPath,
	fieldChange: FieldChange,
	nodeChanges: ChangeAtomIdMap<NodeChangeset>,
	nodeToParent: ChangeAtomIdMap<FieldId>,
	crossFieldKeys: CrossFieldKeyTable,
	idAllocator: IdAllocator = idAllocatorFromMaxId(),
	localCrossFieldKeys: CrossFieldKeyRange[] = [],
	childId: NodeId | undefined = undefined,
): ModularChangeset {
	const fieldChanges: FieldChangeMap = new Map([[path.field, fieldChange]]);

	if (path.parent === undefined) {
		for (const key of localCrossFieldKeys) {
			crossFieldKeys.set(key, { nodeId: undefined, field: path.field });
		}

		if (childId !== undefined) {
			setInChangeAtomIdMap(nodeToParent, childId, {
				nodeId: undefined,
				field: path.field,
			});
		}

		return makeModularChangeset(
			fieldChanges,
			nodeChanges,
			nodeToParent,
			undefined,
			crossFieldKeys,
			idAllocator.getMaxId(),
		);
	}

	const nodeChangeset: NodeChangeset = {
		fieldChanges,
	};

	const parentId: NodeId = { localId: brand(idAllocator.allocate()) };

	for (const key of localCrossFieldKeys) {
		crossFieldKeys.set(key, { nodeId: parentId, field: path.field });
	}

	if (childId !== undefined) {
		setInChangeAtomIdMap(nodeToParent, childId, {
			nodeId: parentId,
			field: path.field,
		});
	}

	return buildModularChangesetFromNode(
		path.parent,
		nodeChangeset,
		nodeChanges,
		nodeToParent,
		crossFieldKeys,
		idAllocator,
		parentId,
	);
}

function buildModularChangesetFromNode(
	path: UpPath,
	nodeChange: NodeChangeset,
	nodeChanges: ChangeAtomIdMap<NodeChangeset>,
	nodeToParent: ChangeAtomIdMap<FieldId>,
	crossFieldKeys: CrossFieldKeyTable,
	idAllocator: IdAllocator,
	nodeId: NodeId = { localId: brand(idAllocator.allocate()) },
): ModularChangeset {
	setInChangeAtomIdMap(nodeChanges, nodeId, nodeChange);
	const fieldChangeset = genericFieldKind.changeHandler.editor.buildChildChange(
		path.parentIndex,
		nodeId,
	);

	const fieldChange: FieldChange = {
		fieldKind: genericFieldKind.identifier,
		change: fieldChangeset,
	};

	return buildModularChangesetFromField(
		{ parent: path.parent, field: path.parentField },
		fieldChange,
		nodeChanges,
		nodeToParent,
		crossFieldKeys,
		idAllocator,
		[],
		nodeId,
	);
}

/**
 * @internal
 */
export interface FieldEditDescription {
	type: "field";
	field: FieldUpPath;
	fieldKind: FieldKindIdentifier;
	change: FieldChangeset;
}

/**
 * @internal
 */
export interface GlobalEditDescription {
	type: "global";
	builds?: ChangeAtomIdMap<TreeChunk>;
}

/**
 * @internal
 */
export type EditDescription = FieldEditDescription | GlobalEditDescription;

function getRevInfoFromTaggedChanges(changes: TaggedChange<ModularChangeset>[]): {
	revInfos: RevisionInfo[];
	maxId: ChangesetLocalId;
} {
	let maxId = -1;
	const revInfos: RevisionInfo[] = [];
	for (const taggedChange of changes) {
		const change = taggedChange.change;
		maxId = Math.max(change.maxId ?? -1, maxId);
		revInfos.push(...revisionInfoFromTaggedChange(taggedChange));
	}

	const revisions = new Set<RevisionTag>();
	const rolledBackRevisions: RevisionTag[] = [];
	for (const info of revInfos) {
		revisions.add(info.revision);
		if (info.rollbackOf !== undefined) {
			rolledBackRevisions.push(info.rollbackOf);
		}
	}

	rolledBackRevisions.reverse();
	for (const revision of rolledBackRevisions) {
		if (!revisions.has(revision)) {
			revInfos.push({ revision });
		}
	}

	return { maxId: brand(maxId), revInfos };
}

function revisionInfoFromTaggedChange(
	taggedChange: TaggedChange<ModularChangeset>,
): RevisionInfo[] {
	const revInfos: RevisionInfo[] = [];
	if (taggedChange.change.revisions !== undefined) {
		revInfos.push(...taggedChange.change.revisions);
	} else if (taggedChange.revision !== undefined) {
		const info: Mutable<RevisionInfo> = { revision: taggedChange.revision };
		if (taggedChange.rollbackOf !== undefined) {
			info.rollbackOf = taggedChange.rollbackOf;
		}
		revInfos.push(info);
	}
	return revInfos;
}

function revisionFromTaggedChange(
	change: TaggedChange<ModularChangeset>,
): RevisionTag | undefined {
	return change.revision ?? revisionFromRevInfos(change.change.revisions);
}

function revisionFromRevInfos(
	revInfos: undefined | readonly RevisionInfo[],
): RevisionTag | undefined {
	if (revInfos === undefined || revInfos.length !== 1) {
		return undefined;
	}
	return revInfos[0].revision;
}

function mergeBTrees<K, V>(tree1: BTree<K, V>, tree2: BTree<K, V>): BTree<K, V> {
	const result = tree1.clone();
	tree2.forEachPair((k, v) => {
		result.set(k, v);
	});

	return result;
}

function mergeNestedMaps<K1, K2, V>(
	map1: NestedMap<K1, K2, V>,
	map2: NestedMap<K1, K2, V>,
): NestedMap<K1, K2, V> {
	const merged: NestedMap<K1, K2, V> = new Map();
	populateNestedMap(map1, merged, true);
	populateNestedMap(map2, merged, true);
	return merged;
}

function fieldChangeFromId(
	fields: FieldChangeMap,
	nodes: ChangeAtomIdMap<NodeChangeset>,
	id: FieldId,
): FieldChange {
	const fieldMap = fieldMapFromNodeId(fields, nodes, id.nodeId);
	return fieldMap.get(id.field) ?? fail("No field exists for the given ID");
}

function fieldMapFromNodeId(
	rootFieldMap: FieldChangeMap,
	nodes: ChangeAtomIdMap<NodeChangeset>,
	nodeId: NodeId | undefined,
): FieldChangeMap {
	if (nodeId === undefined) {
		return rootFieldMap;
	}

	const node = nodeChangeFromId(nodes, nodeId);
	assert(node.fieldChanges !== undefined, "Expected node to have field changes");
	return node.fieldChanges;
}

function rebasedFieldIdFromBaseId(table: RebaseTable, baseId: FieldId): FieldId {
	if (baseId.nodeId === undefined) {
		return baseId;
	}

	return { ...baseId, nodeId: rebasedNodeIdFromBaseNodeId(table, baseId.nodeId) };
}

function rebasedNodeIdFromBaseNodeId(table: RebaseTable, baseId: NodeId): NodeId {
	return getFromChangeAtomIdMap(table.baseToRebasedNodeId, baseId) ?? baseId;
}

function nodeChangeFromId(nodes: ChangeAtomIdMap<NodeChangeset>, id: NodeId): NodeChangeset {
	const node = getFromChangeAtomIdMap(nodes, id);
	assert(node !== undefined, "Unknown node ID");
	return node;
}

function fieldIdFromFieldIdKey([revision, localId, field]: FieldIdKey): FieldId {
	const nodeId = localId !== undefined ? { revision, localId } : undefined;
	return { nodeId, field };
}

function cloneNodeChangeset(nodeChangeset: NodeChangeset): NodeChangeset {
	if (nodeChangeset.fieldChanges !== undefined) {
		return { ...nodeChangeset, fieldChanges: new Map(nodeChangeset.fieldChanges) };
	}

	return { ...nodeChangeset };
}

function replaceFieldIdRevision(
	fieldId: FieldId,
	oldRevisions: Set<RevisionTag | undefined>,
	newRevision: RevisionTag | undefined,
): FieldId {
	if (fieldId.nodeId === undefined) {
		return fieldId;
	}

	return {
		...fieldId,
		nodeId: replaceAtomRevisions(fieldId.nodeId, oldRevisions, newRevision),
	};
}

export function getParentFieldId(changeset: ModularChangeset, nodeId: NodeId): FieldId {
	const parentId = getFromChangeAtomIdMap(changeset.nodeToParent, nodeId);
	assert(parentId !== undefined, "Parent field should be defined");
	return normalizeFieldId(parentId, changeset.nodeAliases);
}

export function getFieldsForCrossFieldKey(
	changeset: ModularChangeset,
	[target, revision, id, count]: CrossFieldKeyRange,
): FieldId[] {
	let firstLocalId: number = id;
	const lastLocalId = id + count - 1;

	const fields: FieldId[] = [];

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const entry = getFirstIntersectingCrossFieldEntry(changeset.crossFieldKeys, [
			target,
			revision,
			brand(firstLocalId),
			count,
		]);

		if (entry === undefined) {
			return fields;
		}

		const [[_target, _revision, entryId, entryCount], fieldId] = entry;
		fields.push(normalizeFieldId(fieldId, changeset.nodeAliases));

		const entryLastId = entryId + entryCount - 1;
		if (entryLastId >= lastLocalId) {
			return fields;
		}

		firstLocalId = entryLastId + 1;
	}
}

function getFirstIntersectingCrossFieldEntry(
	table: CrossFieldKeyTable,
	[target, revision, id, count]: CrossFieldKeyRange,
): [CrossFieldKeyRange, FieldId] | undefined {
	const entry = table.nextLowerPair([target, revision, id, Infinity]);
	if (entry === undefined) {
		return undefined;
	}

	const [entryTarget, entryRevision, entryId, entryCount] = entry[0];
	if (entryTarget !== target || entryRevision !== revision) {
		return undefined;
	}

	const lastQueryId = id + count - 1;
	const entryLastId = entryId + entryCount - 1;
	if (entryId > lastQueryId || entryLastId < id) {
		return undefined;
	}

	return entry;
}

function setInCrossFieldKeyTable(
	table: CrossFieldKeyTable,
	target: CrossFieldTarget,
	revision: RevisionTag | undefined,
	id: ChangesetLocalId,
	count: number,
	value: FieldId,
): void {
	let entry = getFirstIntersectingCrossFieldEntry(table, [target, revision, id, count]);
	const lastQueryId = id + count - 1;
	while (entry !== undefined) {
		const [entryKey, entryValue] = entry;
		table.delete(entryKey);

		const [_target, _revision, entryId, entryCount] = entryKey;
		if (entryId < id) {
			table.set([target, revision, entryId, id - entryId], entryValue);
		}

		const lastEntryId = entryId + entryCount - 1;
		if (lastEntryId > lastQueryId) {
			table.set(
				[target, revision, brand(lastQueryId + 1), lastEntryId - lastQueryId],
				entryValue,
			);
			break;
		}

		const nextId: ChangesetLocalId = brand(lastEntryId + 1);
		entry = getFirstIntersectingCrossFieldEntry(table, [
			target,
			revision,
			nextId,
			lastQueryId - nextId + 1,
		]);
	}

	table.set([target, revision, id, count], value);
}

function normalizeFieldId(fieldId: FieldId, nodeAliases: ChangeAtomIdMap<NodeId>): FieldId {
	return fieldId.nodeId !== undefined
		? { ...fieldId, nodeId: normalizeNodeId(fieldId.nodeId, nodeAliases) }
		: fieldId;
}

function normalizeNodeId(nodeId: NodeId, nodeAliases: ChangeAtomIdMap<NodeId>): NodeId {
	const dealiased = getFromChangeAtomIdMap(nodeAliases, nodeId);
	return dealiased !== undefined ? normalizeNodeId(dealiased, nodeAliases) : nodeId;
}

function hasConflicts(change: ModularChangeset): boolean {
	return (change.constraintViolationCount ?? 0) > 0;
}

export function newCrossFieldKeyTable(): CrossFieldKeyTable {
	return newBTree();
}

function newBTree<K extends readonly unknown[], V>(): TupleBTree<K, V> {
	return brand(new BTree<K, V>(undefined, compareTuples));
}

// This assumes that the arrays are the same length.
function compareTuples(arrayA: readonly unknown[], arrayB: readonly unknown[]): number {
	for (let i = 0; i < arrayA.length; i++) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const a = arrayA[i] as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const b = arrayB[i] as any;
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
	}

	return 0;
}

interface ModularChangesetContent {
	fieldChanges: FieldChangeMap;
	nodeChanges: ChangeAtomIdMap<NodeChangeset>;
	nodeToParent: ChangeAtomIdMap<FieldId>;
	nodeAliases: ChangeAtomIdMap<NodeId>;
	crossFieldKeys: CrossFieldKeyTable;
}

function cloneNestedMap<K1, K2, V>(map: NestedMap<K1, K2, V>): NestedMap<K1, K2, V> {
	const cloned: NestedMap<K1, K2, V> = new Map();
	populateNestedMap(map, cloned, true);
	return cloned;
}
