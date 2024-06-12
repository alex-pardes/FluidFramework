/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { BTree } from "@tylerbu/sorted-btree-es6";
import {
	ChangeAtomId,
	ChangeAtomIdMap,
	ChangesetLocalId,
	FieldKey,
	FieldKindIdentifier,
	RevisionInfo,
	RevisionTag,
} from "../../core/index.js";
import { Brand } from "../../util/index.js";
import { TreeChunk } from "../chunked-forest/index.js";
import { CrossFieldTarget } from "./crossFieldQueries.js";

/**
 * @internal
 */
export interface ModularChangeset extends HasFieldChanges {
	/**
	 * The numerically highest `ChangesetLocalId` used in this changeset.
	 * If undefined then this changeset contains no IDs.
	 */
	readonly maxId?: ChangesetLocalId;
	/**
	 * The revisions included in this changeset, ordered temporally (oldest to newest).
	 * Undefined for anonymous changesets.
	 * Should never be empty.
	 */
	readonly revisions?: readonly RevisionInfo[];
	readonly fieldChanges: FieldChangeMap;
	readonly nodeChanges: ChangeAtomIdMap<NodeChangeset>;

	// TODO: Should this be merged with `nodeChanges`?
	readonly nodeToParent: ChangeAtomIdMap<FieldId>;
	readonly nodeAliases: ChangeAtomIdMap<NodeId>;
	readonly crossFieldKeys: CrossFieldKeyTable;
	readonly constraintViolationCount?: number;
	readonly builds?: ChangeAtomIdMap<TreeChunk>;
	readonly destroys?: ChangeAtomIdMap<number>;
	readonly refreshers?: ChangeAtomIdMap<TreeChunk>;
}

export type CrossFieldKeyTable = BTree<CrossFieldKey, FieldId>;
export type CrossFieldKey = [CrossFieldTarget, RevisionTag | undefined, ChangesetLocalId];

export interface FieldId {
	nodeId: NodeId | undefined;
	field: FieldKey;
}

/**
 * @internal
 */
export interface NodeExistsConstraint {
	violated: boolean;
}

/**
 * Changeset for a subtree rooted at a specific node.
 * @internal
 */
export interface NodeChangeset extends HasFieldChanges {
	nodeExistsConstraint?: NodeExistsConstraint;
}

export type NodeId = ChangeAtomId;

/**
 * @internal
 */
export interface HasFieldChanges {
	fieldChanges?: FieldChangeMap;
}

/**
 * @internal
 */
export type FieldChangeMap = Map<FieldKey, FieldChange>;

/**
 * @internal
 */
export interface FieldChange {
	fieldKind: FieldKindIdentifier;
	change: FieldChangeset;
}

/**
 * @internal
 */
export type FieldChangeset = Brand<unknown, "FieldChangeset">;
