/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { Sibling, Sequenced as S } from "../format";

export namespace PreviousInsert {
    export const e1: S.Transaction = {
        ref: 0,
        seq: 1,
        frames: [{
            marks: {
                foo: [
                    3,
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
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
                    4,
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                ],
            },
        }],
    };

    export const e2_r_e1: S.Transaction = {
        ref: 0,
        newRef: 1,
        seq: 2,
        frames: [{
            marks: {
                foo: [
                    5,
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                ],
            },
        }],
    };
}

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
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
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
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
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
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
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

export namespace ModifiesAtSamePosition {
    export const e1: S.Transaction = {
        ref: 0,
        seq: 1,
        frames: [{
            marks: {
                foo: [{
                    type: "Modify",
                    modify: {
                        bar: [{
                            type: "Modify",
                            modify: {
                                baz: [{ type: "Insert", op: 0, content: [{ id: "0" }] }],
                            },
                        }],
                    },
                }],
            },
        }],
    };

    export const e2: S.Transaction = {
        ref: 0,
        seq: 2,
        frames: [{
            marks: {
                foo: [{
                    type: "Modify",
                    modify: {
                        bar: [{
                            type: "Modify",
                            modify: {
                                baz: [
                                    1,
                                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                                ],
                            },
                        }],
                    },
                }],
            },
        }],
    };

    export const e2_r_e1: S.Transaction = {
        ref: 0,
        seq: 2,
        newRef: 1,
        frames: [{
            marks: {
                foo: [{
                    type: "Modify",
                    modify: {
                        bar: [{
                            type: "Modify",
                            modify: {
                                baz: [
                                    2,
                                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                                ],
                            },
                        }],
                    },
                }],
            },
        }],
    };
}

export namespace InsertAtSameIndexAsModify {
    export const e1: S.Transaction = {
        ref: 0,
        seq: 1,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "0" }], side: Sibling.Next },
                ],
            },
        }],
    };

    export const e2: S.Transaction = {
        ref: 0,
        seq: 2,
        frames: [{
            marks: {
                foo: [{
                    type: "Modify",
                    modify: {
                        bar: [{ type: "Insert", op: 0, content: [{ id: "0" }] }],
                    },
                }],
            },
        }],
    };

    export const e2_r_e1: S.Transaction = {
        ref: 0,
        newRef: 1,
        seq: 2,
        frames: [{
            marks: {
                foo: [
                    1,
                    {
                        type: "Modify",
                        modify: {
                            bar: [{ type: "Insert", op: 0, content: [{ id: "0" }] }],
                        },
                    },
                ],
            },
        }],
    };
}

export namespace DeleteMergingInsertPositions {
    export const e1: S.Transaction = {
        ref: 0,
        seq: 1,
        frames: [{
            marks: {
                foo: [
                    2,
                    { type: "DeleteStart", op: 0 },
                    3,
                    { type: "End", op: 0 },
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
                    5,
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                ],
            },
        }],
    };

    export const e3: S.Transaction = {
        ref: 0,
        seq: 3,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "0" }], side: Sibling.Next },
                ],
            },
        }],
    };

    export const e2_r_e1: S.Transaction = {
        ref: 0,
        newRef: 1,
        seq: 2,
        frames: [{
            marks: {
                foo: [
                    2,
                    { type: "Insert", op: 0, content: [{ id: "0" }] },
                ],
            },
        }],
    };

    export const e3_r_e1: S.Transaction = {
        ref: 0,

        newRef: 1,
        seq: 3,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "0" }], side: Sibling.Next },
                ],
            },
        }],
    };

    export const e3_r_e2: S.Transaction = {
        ref: 0,
        newRef: 2,
        seq: 3,
        frames: [{
            marks: {
                foo: [
                    { type: "Insert", op: 0, content: [{ id: "0" }], side: Sibling.Next },
                ],
            },
        }],
    };
}
