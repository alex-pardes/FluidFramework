/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChangeFamily, Delta } from "../../changeset";
import { AnchorSet } from "../../tree";
import { sequenceChangeRebaser } from "./sequenceChangeRebaser";
import { SequenceChangeset } from "./sequenceChangeset";
import { SequenceEditBuilder } from "./sequenceEditBuilder";

function buildEditor(deltaReceiver: (delta: Delta) => void, anchorSet: AnchorSet): SequenceEditBuilder {
    return new SequenceEditBuilder(deltaReceiver, anchorSet);
}

function intoDelta(change: SequenceChangeset): Delta {
    throw Error("Not implemented"); // TODO
}

export type SequenceChangeFamily = ChangeFamily<SequenceEditBuilder, SequenceChangeset>;

export const sequenceChangeFamily: SequenceChangeFamily = {
    rebaser: sequenceChangeRebaser,
    buildEditor,
    intoDelta,
};
