/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "node:assert";
import { type TreeChangeEvents } from "../../../dist/index.js";
import { rootFieldKey } from "../../core/index.js";
import { TreeStatus, createMockNodeKeyManager } from "../../feature-libraries/index.js";
import {
	NodeFromSchema,
	SchemaFactory,
	treeNodeApi as Tree,
	TreeConfiguration,
} from "../../simple-tree/index.js";
import { getView } from "../utils.js";

import { hydrate } from "./utils.js";

const schema = new SchemaFactory("com.example");

class Point extends schema.object("Point", {}) {}

describe("treeApi", () => {
	it("is", () => {
		const config = new TreeConfiguration([Point, schema.number], () => ({}));
		const root = getView(config).root;
		assert(Tree.is(root, Point));
		assert(root instanceof Point);
		assert(!Tree.is(root, schema.number));
		assert(Tree.is(5, schema.number));
		assert(!Tree.is(root, schema.number));
		assert(!Tree.is(5, Point));

		const NotInDocument = schema.object("never", {});
		// Using a schema that is not in the document throws:
		assert.throws(() => Tree.is(root, NotInDocument));
	});

	it("`is` can narrow polymorphic leaf field content", () => {
		const config = new TreeConfiguration([schema.number, schema.string], () => "x");
		const root = getView(config).root;

		if (Tree.is(root, schema.number)) {
			const _check: number = root;
			assert.fail();
		} else {
			const value: string = root;
			assert.equal(value, "x");
		}
	});

	it("`is` can narrow polymorphic combinations of value and objects", () => {
		const config = new TreeConfiguration([Point, schema.string], () => "x");
		const root = getView(config).root;

		if (Tree.is(root, Point)) {
			const _check: Point = root;
			assert.fail();
		} else {
			const value: string = root;
			assert.equal(value, "x");
		}
	});

	it("schema", () => {
		const config = new TreeConfiguration([Point, schema.number], () => ({}));
		const root = getView(config).root;
		assert.equal(Tree.schema(root), Point);
		assert.equal(Tree.schema(5), schema.number);
	});

	it("key", () => {
		class Child extends schema.object("Child", {
			x: Point,
			y: schema.optional(Point, { key: "stable-y" }),
		}) {}
		const Root = schema.array(Child);
		const config = new TreeConfiguration(Root, (): Child[] => [
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			{
				x: {},
				y: undefined,
			} as Child,
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			{ x: {}, y: {} } as Child,
		]);
		const root = getView(config).root;
		assert.equal(Tree.key(root), rootFieldKey);
		assert.equal(Tree.key(root[0]), 0);
		assert.equal(Tree.key(root[0].x), "x");
		assert.equal(Tree.key(root[1]), 1);
		assert.equal(Tree.key(root[1].x), "x");
		assert(root[1].y !== undefined);
		assert.equal(Tree.key(root[1].y), "y");
	});

	it("parent", () => {
		class Child extends schema.object("Child", { x: Point }) {}
		const Root = schema.array(Child);
		const config = new TreeConfiguration(Root, () => [{ x: {} }, { x: {} }]);
		const root = getView(config).root;
		assert.equal(Tree.parent(root), undefined);
		assert.equal(Tree.parent(root[0]), root);
		assert.equal(Tree.parent(root[1]), root);
		assert.equal(Tree.parent(root[1].x), root[1]);
	});

	it("treeStatus", () => {
		class Root extends schema.object("Root", { x: Point }) {}
		const config = new TreeConfiguration(Root, () => ({ x: {} }));
		const root = getView(config).root;
		const child = root.x;
		const newChild = new Point({});
		assert.equal(Tree.status(root), TreeStatus.InDocument);
		assert.equal(Tree.status(child), TreeStatus.InDocument);
		// TODO: This API layer should have an Unhydrated status:
		// assert.equal(nodeApi.status(newChild), TreeStatus.Unhydrated);
		root.x = newChild;
		assert.equal(Tree.status(root), TreeStatus.InDocument);
		assert.equal(Tree.status(child), TreeStatus.Removed);
		assert.equal(Tree.status(newChild), TreeStatus.InDocument);
		// TODO: test Deleted status.
	});

	describe("shortID", () => {
		it("returns local id when an identifier fieldkind exists.", () => {
			const schemaWithIdentifier = schema.object("parent", {
				identifier: schema.identifier,
			});
			const nodeKeyManager = createMockNodeKeyManager();
			const id = nodeKeyManager.stabilizeNodeKey(nodeKeyManager.generateLocalNodeKey());
			const config = new TreeConfiguration(schemaWithIdentifier, () => ({
				identifier: id,
			}));

			const root = getView(config, nodeKeyManager).root;

			assert.equal(Tree.shortId(root), nodeKeyManager.localizeNodeKey(id));
		});
		it("returns undefined when an identifier fieldkind does not exist.", () => {
			const schemaWithIdentifier = schema.object("parent", {
				identifier: schema.string,
			});
			const config = new TreeConfiguration(schemaWithIdentifier, () => ({
				identifier: "testID",
			}));
			const root = getView(config).root;
			assert.equal(Tree.shortId(root), undefined);
		});
		it("returns the uncompressed identifier value when the provided identifier is an invalid stable id.", () => {
			const schemaWithIdentifier = schema.object("parent", {
				identifier: schema.identifier,
			});
			const config = new TreeConfiguration(schemaWithIdentifier, () => ({
				identifier: "invalidUUID",
			}));

			const root = getView(config).root;

			assert.equal(Tree.shortId(root), "invalidUUID");
		});
		it("returns the uncompressed identifier value when the provided identifier is a valid stable id, but unknown by the idCompressor.", () => {
			const schemaWithIdentifier = schema.object("parent", {
				identifier: schema.identifier,
			});
			// Create a valid stableNodeKey which is not known by the tree's idCompressor.
			const nodeKeyManager = createMockNodeKeyManager();
			const stableNodeKey = nodeKeyManager.stabilizeNodeKey(
				nodeKeyManager.generateLocalNodeKey(),
			);

			const config = new TreeConfiguration(schemaWithIdentifier, () => ({
				identifier: stableNodeKey,
			}));

			const root = getView(config).root;

			assert.equal(Tree.shortId(root), stableNodeKey);
		});
	});

	describe("on", () => {
		describe("object node", () => {
			const sb = new SchemaFactory("object-node-in-root");
			class myObject extends sb.object("object", {
				myNumber: sb.number,
			}) {}
			const treeSchema = sb.object("root", {
				rootObject: myObject,
			});

			function check(
				eventName: keyof TreeChangeEvents,
				mutate: (root: NodeFromSchema<typeof treeSchema>) => void,
				expectedFirings: number = 1,
			) {
				it(`.on('${eventName}') subscribes and unsubscribes correctly`, () => {
					const root = hydrate(treeSchema, {
						rootObject: {
							myNumber: 1,
						},
					});
					const log: any[][] = [];

					const unsubscribe = Tree.on(root, eventName, (...args: any[]) => {
						log.push(args);
					});

					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should fire.`);

					unsubscribe();
					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should NOT fire.`);
				});
			}

			check(
				"nodeChanged",
				(root) =>
					(root.rootObject = new myObject({
						myNumber: 2,
					})),
			);
			// treeChanged fires during both the detach and attach visitor passes
			check("treeChanged", (root) => root.rootObject.myNumber++, 2);

			it(`change to direct fields triggers both 'nodeChanged' and 'treeChanged'`, () => {
				const root = hydrate(treeSchema, {
					rootObject: {
						myNumber: 1,
					},
				});

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				root.rootObject = new myObject({
					myNumber: 2,
				});

				assert.equal(shallowChanges, 1, `nodeChanged should fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // Fires during both the detach and attach visitor passes
			});

			it(`change to descendant fields only triggers 'treeChanged'`, () => {
				const root = hydrate(treeSchema, {
					rootObject: {
						myNumber: 1,
					},
				});

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				root.rootObject.myNumber++;

				assert.equal(shallowChanges, 0, `nodeChanged should NOT fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // Fires during both the detach and attach visitor passes
			});
		});

		describe("list node", () => {
			const sb = new SchemaFactory("list-node-in-root");
			class myObject extends sb.object("object", {
				myNumber: sb.number,
			}) {}
			const treeSchema = sb.array("root", myObject);

			function check(
				eventName: keyof TreeChangeEvents,
				mutate: (root: NodeFromSchema<typeof treeSchema>) => void,
				expectedFirings: number = 1,
			) {
				it(`.on('${eventName}') subscribes and unsubscribes correctly`, () => {
					const root = hydrate(treeSchema, [
						{
							myNumber: 1,
						},
					]);
					const log: any[][] = [];

					const unsubscribe = Tree.on(root, eventName, (...args: any[]) => {
						log.push(args);
					});

					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should fire.`);

					unsubscribe();
					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should NOT fire.`);
				});
			}

			check("nodeChanged", (root) => root.insertAtEnd({ myNumber: 2 }));
			// treeChanged fires during both the detach and attach visitor passes
			check("treeChanged", (root) => root[0].myNumber++, 2);

			it(`change to direct fields triggers both 'nodeChanged' and 'treeChanged'`, () => {
				const root = hydrate(treeSchema, [
					{
						myNumber: 1,
					},
				]);

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				root.insertAtEnd({ myNumber: 2 });

				assert.equal(shallowChanges, 1, `nodeChanged should NOT fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // Fires during both the detach and attach visitor passes
			});

			it(`change to descendant fields only triggers 'treeChanged'`, () => {
				const root = hydrate(treeSchema, [
					{
						myNumber: 1,
					},
				]);

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				root[0].myNumber++;

				assert.equal(shallowChanges, 0, `nodeChanged should NOT fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // Fires during both the detach and attach visitor passes
			});

			it(`move between array nodes triggers both 'nodeChanged' and 'treeChanged' the correct number of times on source and target nodes`, () => {
				const testSchema = sb.object("root", {
					array1: sb.array(sb.number),
					array2: sb.array(sb.number),
				});
				const root = hydrate(testSchema, {
					array1: [1],
					array2: [2],
				});

				let a1ShallowChanges = 0;
				let a1DeepChanges = 0;
				let a2ShallowChanges = 0;
				let a2DeepChanges = 0;
				Tree.on(root.array1, "nodeChanged", (...args: any[]) => a1ShallowChanges++);
				Tree.on(root.array1, "treeChanged", (...args: any[]) => a1DeepChanges++);
				Tree.on(root.array2, "nodeChanged", (...args: any[]) => a2ShallowChanges++);
				Tree.on(root.array2, "treeChanged", (...args: any[]) => a2DeepChanges++);

				root.array2.moveToEnd(0, root.array1);

				assert.deepEqual(root.array1, []);
				assert.deepEqual(root.array2, [2, 1]);
				assert.equal(a1ShallowChanges, 1, `nodeChanged should fire once.`);
				assert.equal(a1DeepChanges, 2, `treeChanged should fire twice.`); // Fires during both the detach and attach visitor passes
				assert.equal(a2ShallowChanges, 1, `nodeChanged should fire once.`);
				assert.equal(a2DeepChanges, 2, `treeChanged should fire twice.`); // Fires during both the detach and attach visitor passes
			});
		});

		describe("map node", () => {
			const sb = new SchemaFactory("map-node-in-root");
			class myObject extends sb.object("object", {
				myNumber: sb.number,
			}) {}
			const treeSchema = sb.map("root", myObject);

			function check(
				eventName: keyof TreeChangeEvents,
				mutate: (root: NodeFromSchema<typeof treeSchema>) => void,
				expectedFirings: number = 1,
			) {
				it(`.on('${eventName}') subscribes and unsubscribes correctly`, () => {
					const root = hydrate(
						treeSchema,
						new Map([
							[
								"a",
								{
									myNumber: 1,
								},
							],
						]),
					);
					const log: any[][] = [];

					const unsubscribe = Tree.on(root, eventName, (...args: any[]) => {
						log.push(args);
					});

					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should fire.`);

					unsubscribe();
					mutate(root);

					assert.equal(log.length, expectedFirings, `'${eventName}' should NOT fire.`);
				});
			}

			check("nodeChanged", (root) => root.set("a", { myNumber: 2 }));
			check(
				"treeChanged",
				(root) => {
					const mapEntry = root.get("a");
					if (mapEntry === undefined) {
						throw new Error("Map entry for key 'a' not found");
					}
					mapEntry.myNumber++;
				},
				2,
			);

			it(`change to direct fields triggers both 'nodeChanged' and 'treeChanged'`, () => {
				const root = hydrate(
					treeSchema,
					new Map([
						[
							"a",
							{
								myNumber: 1,
							},
						],
					]),
				);

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				root.set("a", { myNumber: 2 });

				assert.equal(shallowChanges, 1, `nodeChanged should fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // Fires during both the detach and attach visitor passes
			});

			it(`change to descendant fields only triggers 'treeChanged'`, () => {
				const root = hydrate(
					treeSchema,
					new Map([
						[
							"a",
							{
								myNumber: 1,
							},
						],
					]),
				);

				let shallowChanges = 0;
				let deepChanges = 0;
				Tree.on(root, "nodeChanged", (...args: any[]) => shallowChanges++);
				Tree.on(root, "treeChanged", (...args: any[]) => deepChanges++);

				const mapEntry = root.get("a");
				if (mapEntry === undefined) {
					throw new Error("Map entry for key 'a' not found");
				}
				mapEntry.myNumber++;

				assert.equal(shallowChanges, 0, `nodeChanged should NOT fire.`);
				assert.equal(deepChanges, 2, `treeChanged should fire.`); // treeChanged fires during both the detach and attach visitor passes
			});
		});

		// Change events don't apply to leaf nodes since they don't have fields that change, they are themselves replaced
		// by other leaf nodes.

		it(`all kinds of changes trigger 'nodeChanged' and 'treeChanged' the correct number of times`, () => {
			// This test validates that any kind of change fires the events as expected.
			// Like noted in other tests, 'treeChanged' fires during both the detach and attach visitor passes so it
			// normally fires twice for any change. 'nodeChanged' usually fires once, except during moves between
			// sequences, where it fires when detaching the node from its source, and again while attaching it to the target.

			const sb = new SchemaFactory("object-node-in-root");
			const innerObject = sb.object("inner-object", { innerProp: sb.number });
			class map extends sb.map("map", sb.number) {}
			class list extends sb.array("list", sb.number) {}
			const outerObject = sb.object("outer-object", {
				objectProp: sb.optional(innerObject),
				mapProp: sb.optional(map),
				arrayProp: sb.optional(list),
				valueProp: sb.optional(sb.number),
			});
			const treeSchema = sb.object("root", {
				rootObject: outerObject,
			});

			const root = hydrate(treeSchema, {
				rootObject: {
					objectProp: undefined,
					mapProp: undefined,
					arrayProp: undefined,
					valueProp: undefined,
				},
			});

			let shallowChanges = 0;
			let deepChanges = 0;
			// Deep changes subscription on the root
			Tree.on(root, "treeChanged", (...args: any[]) => {
				deepChanges++;
			});
			// Shallow changes subscription on the object property of the root
			Tree.on(root.rootObject, "nodeChanged", (...args: any[]) => {
				shallowChanges++;
			});

			let deepActionsSoFar = 0;
			let shallowActionsSoFar = 0;

			function actAndVerify(
				action: () => void,
				deepActionsIncrement: number,
				shallowActionsIncrement: number,
			) {
				action();
				deepActionsSoFar += deepActionsIncrement;
				shallowActionsSoFar += shallowActionsIncrement;
				assert.equal(shallowChanges, shallowActionsSoFar);
				assert.equal(deepChanges, deepActionsSoFar);
			}

			// Attach value node
			actAndVerify(() => (root.rootObject.valueProp = 1), 2, 1);
			// Replace value node
			actAndVerify(() => (root.rootObject.valueProp = 2), 2, 1);
			// Detach value node
			actAndVerify(() => (root.rootObject.valueProp = undefined), 2, 1);

			// Attach object node
			actAndVerify(
				() => (root.rootObject.objectProp = new innerObject({ innerProp: 1 })),
				2,
				1,
			);
			// Replace object node
			actAndVerify(
				() => (root.rootObject.objectProp = new innerObject({ innerProp: 2 })),
				2,
				1,
			);
			// Detach object node
			actAndVerify(() => (root.rootObject.objectProp = undefined), 2, 1);

			// Attach map node
			actAndVerify(() => (root.rootObject.mapProp = new map(new Map([["a", 1]]))), 2, 1);
			// Replace map node
			actAndVerify(() => (root.rootObject.mapProp = new map(new Map([["b", 2]]))), 2, 1);
			// Set key on map node (we set it above, we know it's good even if it's optional)
			actAndVerify(() => root.rootObject.mapProp?.set("c", 3), 2, 0); // The node at mapProp isn't changing so no shallow change on rootObject
			// Delete key on map node (we set it above, we know it's good even if it's optional)
			actAndVerify(() => root.rootObject.mapProp?.delete("c"), 2, 0); // The node at mapProp isn't changing so no shallow change on rootObject
			// Detach map node
			actAndVerify(() => (root.rootObject.mapProp = undefined), 2, 1);

			// Attach array node
			actAndVerify(() => (root.rootObject.arrayProp = new list([1])), 2, 1);
			// Replace array node
			actAndVerify(() => (root.rootObject.arrayProp = new list([2])), 2, 1);
			// Insert into array node (we set it above, we know it's good even if it's optional)
			actAndVerify(() => root.rootObject.arrayProp?.insertAtEnd(3), 2, 0); // The node at arrayProp isn't changing so no shallow change on rootObject
			// Move within array node (we set it above, we know it's good even if it's optional)
			actAndVerify(() => root.rootObject.arrayProp?.moveToEnd(0), 2, 0); // The node at arrayProp isn't changing so no shallow change on rootObject
			// Remove from array node (we set it above, we know it's good even if it's optional)
			actAndVerify(() => root.rootObject.arrayProp?.removeAt(0), 2, 0); // The node at arrayProp isn't changing so no shallow change on rootObject
			// Detach array node
			actAndVerify(() => (root.rootObject.arrayProp = undefined), 2, 1);
		});
	});
});
