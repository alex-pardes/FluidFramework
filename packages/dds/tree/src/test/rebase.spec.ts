/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import { rebase as rebaseImpl } from "../rebase";
import {
	Sequenced as S,
	Rebased as R,
} from "../format";
import {
	DeleteMergingInsertPositions,
    InsertAtSameIndexAsModify,
	InsertBeforeModify,
	InterleavedInserts,
    ModifiesAtSamePosition,
    PreviousInsert,
} from "./samples";
import { deepFreeze } from "./utils";

function rebase(original: R.Transaction, base: S.Transaction): R.Transaction {
	deepFreeze(original);
	deepFreeze(base);
	return rebaseImpl(original, base);
}

describe(rebase.name, () => {
	describe("Scenarios", () => {
		describe("Previous insert", () => {
			it("e2", () => {
                testRebase(
                    PreviousInsert.e1,
                    PreviousInsert.e2,
                    PreviousInsert.e2_r_e1,
                );
			});
		});

		describe("Interleaved inserts", () => {
			it("e2", () => {
                testRebase(
                    InterleavedInserts.e1,
                    InterleavedInserts.e2,
                    InterleavedInserts.e2_r_e1,
                );
			});
		});

		describe("Modifies at same position", () => {
			it("e2", () => {
                testRebase(
                    ModifiesAtSamePosition.e1,
                    ModifiesAtSamePosition.e2,
                    ModifiesAtSamePosition.e2_r_e1,
                );
			});
		});

		describe("Insert at same index as modify", () => {
			it("e2 over e1", () => {
                testRebase(
                    InsertAtSameIndexAsModify.e1,
                    InsertAtSameIndexAsModify.e2,
                    InsertAtSameIndexAsModify.e2_r_e1,
                );
			});
		});

        describe("Insert before modify", () => {
			it("e2", () => {
                testRebase(
                    InsertBeforeModify.e1,
                    InsertBeforeModify.e2,
                    InsertBeforeModify.e2_r_e1,
                );
			});
		});

        describe("Delete merging insert positions", () => {
			it("e2", () => {
                testRebase(
                    DeleteMergingInsertPositions.e1,
                    DeleteMergingInsertPositions.e2,
                    DeleteMergingInsertPositions.e2_r_e1,
                );
			});
		});
	});
});

function testRebase(
    base: S.Transaction,
    original: R.Transaction,
    expected: R.Transaction,
) {
    const actual = rebase(original, base);
    assert.deepEqual(actual, expected);
}
