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
    ChangesInDeepTraits,
	InterleavedInserts,
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
				const actual = rebase(PreviousInsert.e2, PreviousInsert.e1);
				assert.deepEqual(actual, PreviousInsert.e2_r_e1);
			});
		});

		describe("Interleaved inserts", () => {
			it("e2", () => {
				const actual = rebase(InterleavedInserts.e2, InterleavedInserts.e1);
				assert.deepEqual(actual, InterleavedInserts.e2_r_e1);
			});
		});

		describe("Changes in deep traits", () => {
			it("e2", () => {
				const actual = rebase(ChangesInDeepTraits.e2, ChangesInDeepTraits.e1);
				assert.deepEqual(actual, ChangesInDeepTraits.e2_r_e1);
			});
		});
	});
});
