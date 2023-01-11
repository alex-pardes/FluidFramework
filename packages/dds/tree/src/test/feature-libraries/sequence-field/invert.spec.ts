/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import { RevisionTag, tagChange } from "../../../core";
import { brand } from "../../../util";
import { TestChange } from "../../testChange";
import { deepFreeze } from "../../utils";
import { composeAnonChanges, invert as invertChange } from "./utils";
import { ChangeMaker as Change, TestChangeset } from "./testEdits";

function invert(change: TestChangeset): TestChangeset {
    deepFreeze(change);
    return invertChange(tagChange(change, tag));
}

const tag: RevisionTag = brand(42);

describe("SequenceField - Invert", () => {
    it("no changes", () => {
        const input: TestChangeset = [];
        const expected: TestChangeset = [];
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("child changes", () => {
        const childChange = TestChange.mint([0], 1);
        const inverseChildChange = TestChange.invert(childChange);
        const input = Change.modify(0, childChange);
        const expected = Change.modify(0, inverseChildChange);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("insert => delete", () => {
        const input = Change.insert(0, 2);
        const expected = Change.delete(0, 2);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("modified insert => delete", () => {
        const insert = Change.insert(0, 1);
        const modify = Change.modify(0, TestChange.mint([], 42));
        const input = composeAnonChanges([insert, modify]);
        const expected = Change.delete(0, 1);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("delete => revive", () => {
        const input = Change.delete(0, 2);
        const expected = Change.revive(0, 2, 0, tag);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("revive => delete", () => {
        const input = Change.revive(0, 2, 0, tag);
        const expected = Change.delete(0, 2);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("move => return", () => {
        const input = Change.move(0, 2, 3);
        const expected = Change.return(3, 2, 0, tag, 0);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });

    it("return => return", () => {
        const input = Change.return(0, 2, 3, brand(41), 0);
        const expected = Change.return(3, 2, 0, tag, 0);
        const actual = invert(input);
        assert.deepEqual(actual, expected);
    });
});
