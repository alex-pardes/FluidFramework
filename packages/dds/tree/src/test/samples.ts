/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { Rebased as R, Sibling, Sequenced as S } from "../format";

export namespace InterleavedInserts {
    /*
    Starting state foo=[A B C D]
    State after e1 foo=[W A X Y C Z D]
    */
    export const e1: S.Transaction = {
        ref: 0,
        seq: 1,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "O" }] },
                    1,
                    { type: "Insert", op: 1, content: [{ id: "1" }] },
                    { type: "Insert", op: 2, content: [{ id: "2" }] },
                    2,
                    { type: "Insert", op: 3, content: [{ id: "3" }] },
                ],
            },
        }],
    };

    export const e2: S.Transaction = {
        ref: 0,
        seq: 2,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "O" }] },
                    1,
                    { type: "Insert", op: 1, content: [{ id: "1" }], side: Sibling.Next },
                    { type: "Insert", op: 2, content: [{ id: "2" }], side: Sibling.Prev },
                    2,
                    { type: "Insert", op: 3, content: [{ id: "3" }] },
                ],
            },
        }],
    };

    export const e2_r_e1: S.Transaction = {
        ref: 0,
        seq: 2,
        newRef: 1,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "O" }] },
                    4,
                    { type: "Insert", op: 1, content: [{ id: "1" }], side: Sibling.Next },
                    { type: "Insert", op: 2, content: [{ id: "2" }], side: Sibling.Prev },
                    2,
                    { type: "Insert", op: 3, content: [{ id: "3" }] },
                ],
            },
        }],
    };
}
