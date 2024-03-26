/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { SequenceField } from "../../../feature-libraries/index.js";
import { TestChange } from "../../testChange.js";
import { takeJsonSnapshot, useSnapshotDirectory } from "../../snapshots/index.js";
// eslint-disable-next-line import/no-internal-modules
import { createSnapshotCompressor } from "../../snapshots/testTrees.js";
import { RevisionTagCodec } from "../../../core/index.js";
import { fail } from "../../../index.js";
import { generatePopulatedMarks } from "./populatedMarks.js";
import { TestNodeId } from "../../testNodeId.js";

export function testSnapshots() {
	describe("Snapshots", () => {
		useSnapshotDirectory("sequence-field");
		const compressor = createSnapshotCompressor();
		const baseContext = {
			originatorId: compressor.localSessionId,
		};

		const family = SequenceField.sequenceFieldChangeCodecFactory(
			new RevisionTagCodec(compressor),
		);
		const marks = generatePopulatedMarks(compressor);
		for (const version of family.getSupportedFormats()) {
			describe(`version ${version}`, () => {
				const codec = family.resolve(version);
				marks.forEach((mark, index) => {
					it(`${index} - ${"type" in mark ? mark.type : "NoOp"}`, () => {
						const changeset = [mark];
						const encoded = codec.json.encode(changeset, {
							baseContext,
							encodeNode: (node) => TestNodeId.encode(node, baseContext),
							decodeNode: (node) => TestNodeId.decode(node, baseContext),
						});
						takeJsonSnapshot(encoded);
					});
				});
			});
		}
	});
}
