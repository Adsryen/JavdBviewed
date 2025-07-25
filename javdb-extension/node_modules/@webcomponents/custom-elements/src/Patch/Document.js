/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */
import PatchParentNode from './Interface/ParentNode.js';
import * as Native from './Native.js';
export default function (internals) {
    Document.prototype.createElement = function (localName) {
        return internals.createAnElement(this, localName, null);
    };
    Document.prototype.importNode = function (node, deep) {
        const clone = Native.Document_importNode.call(this, node, !!deep);
        // Only create custom elements if this document is associated with the
        // registry.
        if (!this.__CE_registry) {
            internals.patchTree(clone);
        }
        else {
            internals.patchAndUpgradeTree(clone);
        }
        return clone;
    };
    Document.prototype.createElementNS = function (namespace, localName) {
        return internals.createAnElement(this, localName, namespace);
    };
    PatchParentNode(internals, Document.prototype, {
        prepend: Native.Document_prepend,
        append: Native.Document_append,
    });
}
//# sourceMappingURL=Document.js.map