import { BTree } from "@tylerbu/sorted-btree-es6";
import type {
	ChangeAtomIdMap,
	FieldKey,
	FieldKindIdentifier,
	RevisionInfo,
	RevisionMetadataSource,
} from "../../../core/index.js";
import type {
	CrossFieldManager,
	FieldChangeHandler,
	FieldChangeMap,
	ModularChangeFamily,
	ModularChangeset,
	NodeId,
} from "../../../feature-libraries/index.js";
import type {
	CrossFieldKeyTable,
	FieldChange,
	FieldId,
	NodeChangeset,
	// eslint-disable-next-line import/no-internal-modules
} from "../../../feature-libraries/modular-schema/modularChangeTypes.js";
import {
	type IdAllocator,
	type Mutable,
	brand,
	fail,
	idAllocatorFromMaxId,
	nestedMapFromFlatList,
	nestedMapToFlatList,
	setInNestedMap,
} from "../../../util/index.js";
import {
	getChangeHandler,
	getFieldsForCrossFieldKey,
	getParentFieldId,
	// eslint-disable-next-line import/no-internal-modules
} from "../../../feature-libraries/modular-schema/modularChangeFamily.js";
import { strict as assert } from "assert";

export const Change = {
	build,
	node,
	nodeWithId,
	field: newField,
};

export interface FieldChangesetDescription {
	readonly fieldKey: FieldKey;
	readonly kind: FieldKindIdentifier;
	readonly changeset: unknown;
	readonly children: NodeChangesetDescription[];
}

export interface NodeChangesetDescription {
	readonly id?: NodeId;
	readonly index: number;
	readonly fields: FieldChangesetDescription[];
}

function node(
	index: number,
	...fields: FieldChangesetDescription[]
): NodeChangesetDescription {
	return { index, fields };
}

function nodeWithId(
	index: number,
	id: NodeId,
	...fields: FieldChangesetDescription[]
): NodeChangesetDescription {
	return { id, index, fields };
}

function newField(
	fieldKey: FieldKey,
	kind: FieldKindIdentifier,
	changeset: unknown,
	...children: NodeChangesetDescription[]
): FieldChangesetDescription {
	return { fieldKey, kind, changeset, children };
}

interface BuildArgs {
	family: ModularChangeFamily;
	maxId?: number;
	revisions?: RevisionInfo[];
}

function build(args: BuildArgs, ...fields: FieldChangesetDescription[]): ModularChangeset {
	const nodeChanges: ChangeAtomIdMap<NodeChangeset> = new Map();
	const nodeToParent: ChangeAtomIdMap<FieldId> = new Map();
	const crossFieldKeys: CrossFieldKeyTable = new BTree();

	const idAllocator = idAllocatorFromMaxId();
	const fieldChanges = fieldChangeMapFromDescription(
		args.family,
		fields,
		undefined,
		nodeChanges,
		nodeToParent,
		crossFieldKeys,
		idAllocator,
	);

	const result: Mutable<ModularChangeset> = {
		nodeChanges,
		fieldChanges,
		nodeToParent,
		crossFieldKeys,
		nodeAliases: new Map(),
		maxId: brand(args.maxId ?? idAllocator.getMaxId()),
	};

	if (args.revisions !== undefined) {
		result.revisions = args.revisions;
	}

	return result;
}

function fieldChangeMapFromDescription(
	family: ModularChangeFamily,
	fields: FieldChangesetDescription[],
	parent: NodeId | undefined,
	nodes: ChangeAtomIdMap<NodeChangeset>,
	nodeToParent: ChangeAtomIdMap<FieldId>,
	crossFieldKeys: CrossFieldKeyTable,
	idAllocator: IdAllocator,
): FieldChangeMap {
	const map: FieldChangeMap = new Map();
	for (const field of fields) {
		const changeHandler = getChangeHandler(family.fieldKinds, field.kind);
		const fieldId: FieldId = {
			nodeId: parent,
			field: field.fieldKey,
		};

		const fieldChangeset = field.children.reduce(
			(change: unknown, nodeDescription: NodeChangesetDescription) =>
				addNodeToField(
					family,
					change,
					nodeDescription,
					fieldId,
					changeHandler,
					nodes,
					nodeToParent,
					crossFieldKeys,
					idAllocator,
				),

			field.changeset,
		);

		for (const key of changeHandler.getCrossFieldKeys(fieldChangeset)) {
			crossFieldKeys.set(key, fieldId);
		}

		const fieldChange: FieldChange = {
			fieldKind: field.kind,
			change: brand(fieldChangeset),
		};
		map.set(field.fieldKey, fieldChange);
	}

	return map;
}

function addNodeToField(
	family: ModularChangeFamily,
	fieldChangeset: unknown,
	nodeDescription: NodeChangesetDescription,
	parentId: FieldId,
	changeHandler: FieldChangeHandler<unknown>,
	nodes: ChangeAtomIdMap<NodeChangeset>,
	nodeToParent: ChangeAtomIdMap<FieldId>,
	crossFieldKeys: CrossFieldKeyTable,
	idAllocator: IdAllocator,
): unknown {
	const nodeId: NodeId = nodeDescription.id ?? {
		localId: brand(idAllocator.allocate()),
	};

	const nodeChangeset: NodeChangeset = {
		fieldChanges: fieldChangeMapFromDescription(
			family,
			nodeDescription.fields,
			nodeId,
			nodes,
			nodeToParent,
			crossFieldKeys,
			idAllocator,
		),
	};

	setInNestedMap(nodes, nodeId.revision, nodeId.localId, nodeChangeset);
	setInNestedMap(nodeToParent, nodeId.revision, nodeId.localId, parentId);

	const fieldWithChange = changeHandler.editor.buildChildChange(nodeDescription.index, nodeId);

	return changeHandler.rebaser.compose(
		fieldWithChange,
		fieldChangeset,
		(node1, node2) => node1 ?? node2 ?? fail("Should not compose two undefined nodes"),
		idAllocator,
		dummyCrossFieldManager,
		dummyRevisionMetadata,
	);
}

const dummyCrossFieldManager: CrossFieldManager = {
	get: (_target, _revision, _id, count, _addDependency) => ({
		value: undefined,
		length: count,
	}),
	set: () => fail("Not supported"),
	moveKey: () => fail("Not supported"),
};

const dummyRevisionMetadata: RevisionMetadataSource = {
	getIndex: () => fail("Not supported"),
	tryGetInfo: () => fail("Not supported"),
	hasRollback: () => fail("Not supported"),
};

export function removeAliases(changeset: ModularChangeset): ModularChangeset {
	const updatedNodeToParent = nestedMapFromFlatList(
		nestedMapToFlatList(changeset.nodeToParent).map(([revision, localId, _field]) => [
			revision,
			localId,
			getParentFieldId(changeset, { revision, localId }),
		]),
	);

	const updatedCrossFieldKeys: CrossFieldKeyTable = new BTree();
	for (const key of changeset.crossFieldKeys.keys()) {
		const fields = getFieldsForCrossFieldKey(changeset, key);
		assert(fields.length === 1);
		updatedCrossFieldKeys.set(key, fields[0]);
	}

	return {
		...changeset,
		nodeToParent: updatedNodeToParent,
		crossFieldKeys: updatedCrossFieldKeys,
		nodeAliases: new Map(),
	};
}
