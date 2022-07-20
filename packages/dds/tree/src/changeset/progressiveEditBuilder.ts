/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChangeRebaser } from "../rebase";
import { AnchorSet } from "../tree";
import { Root as Delta } from "./delta";

export abstract class ProgressiveEditBuilder<TChange> {
    private readonly changes: TChange[] = [];
    constructor(
        private readonly changeFamily: ChangeFamily<unknown, TChange>,
        private readonly deltaReceiver: (delta: Delta) => void,
        private readonly anchorSet: AnchorSet) {}

    /**
     * Subclasses add editing methods which call this with their generated edits.
     */
    protected applyChange(change: TChange): void {
        this.changes.push(change);
        this.changeFamily.rebaser.rebaseAnchors(this.anchorSet, change);
        const delta = this.changeFamily.intoDelta(change);
        this.deltaReceiver(delta);
    }

    /**
     * @returns a copy of the internal change list so far.
     */
    public getChanges(): TChange[] {
        return [...this.changes];
    }
}

export interface ChangeFamily<TEditor, TChange> {
    buildEditor(deltaReceiver: (delta: Delta) => void, anchorSet: AnchorSet): TEditor;
    intoDelta(change: TChange): Delta;
    // TODO more specific types
    readonly rebaser: ChangeRebaser<TChange, TChange, TChange>;
}
