/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { FieldChangeHandler } from "../modular-schema/index.js";

import { relevantRemovedRoots } from "./relevantRemovedRoots.js";
import { sequenceFieldChangeRebaser } from "./sequenceFieldChangeRebaser.js";
import { sequenceFieldChangeCodecFactory } from "./sequenceFieldCodecs.js";
import { SequenceFieldEditor, sequenceFieldEditor } from "./sequenceFieldEditor.js";
import { sequenceFieldToDelta } from "./sequenceFieldToDelta.js";
import { Changeset } from "./types.js";
import { createEmpty, getCrossFieldKeys, isEmpty } from "./utils.js";

export type SequenceFieldChangeHandler = FieldChangeHandler<Changeset, SequenceFieldEditor>;

export const sequenceFieldChangeHandler: SequenceFieldChangeHandler = {
	rebaser: sequenceFieldChangeRebaser,
	codecsFactory: sequenceFieldChangeCodecFactory,
	editor: sequenceFieldEditor,
	intoDelta: sequenceFieldToDelta,
	relevantRemovedRoots,
	isEmpty,
	createEmpty,
	getCrossFieldKeys,
};
