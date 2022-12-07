/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChangesetLocalId, SequenceField as SF } from "../../../feature-libraries";
import { Delta, TaggedChange } from "../../../core";
import { TestChange } from "../../testChange";
import { assertMarkListEqual, deepFreeze, fakeRepair } from "../../utils";
import { makeAnonChange, tagChange } from "../../../rebase";
import { brand } from "../../../util";
import { TestChangeset } from "./testEdits";

export function composeAnonChanges(changes: TestChangeset[]): TestChangeset {
    const taggedChanges = changes.map(makeAnonChange);
    return SF.sequenceFieldChangeRebaser.compose(
        taggedChanges,
        TestChange.compose,
        TestChange.newIdAllocator(getMaxIdTagged(taggedChanges)),
    );
}

export function rebaseTagged(
    change: TaggedChange<TestChangeset>,
    ...base: TaggedChange<TestChangeset>[]
): TaggedChange<TestChangeset> {
    deepFreeze(change);
    deepFreeze(base);

    let currChange = change;
    for (const baseChange of base) {
        currChange = tagChange(
            SF.rebase(
                currChange.change,
                baseChange,
                TestChange.rebase,
                TestChange.newIdAllocator(getMaxId(currChange.change)),
            ),
            change.revision,
        );
    }
    return currChange;
}

export function checkDeltaEquality(actual: TestChangeset, expected: TestChangeset) {
    assertMarkListEqual(toDelta(actual), toDelta(expected));
}

function toDelta(change: TestChangeset): Delta.MarkList {
    return SF.sequenceFieldToDelta(change, TestChange.toDelta, fakeRepair);
}

export function getMaxId(change: SF.Changeset<unknown>): ChangesetLocalId | undefined {
    let max: ChangesetLocalId | undefined;
    for (const mark of change) {
        if (SF.isObjMark(mark)) {
            switch (mark.type) {
                case "MoveIn":
                case "MMoveIn":
                case "MoveOut":
                case "MMoveOut":
                    max = max === undefined ? mark.id : brand(Math.max(max, mark.id));
                    break;
                default:
                    break;
            }
        }
    }

    return max;
}

export function getMaxIdTagged(
    changes: TaggedChange<SF.Changeset<unknown>>[],
): ChangesetLocalId | undefined {
    const reduceMax = (
        max: ChangesetLocalId | undefined,
        c: SF.Changeset<unknown>,
    ): ChangesetLocalId | undefined => {
        const currMax = getMaxId(c);
        return max !== undefined && currMax !== undefined
            ? brand(Math.max(max, currMax))
            : max ?? currMax;
    };
    return changes.map((c) => c.change).reduce(reduceMax, undefined);
}
