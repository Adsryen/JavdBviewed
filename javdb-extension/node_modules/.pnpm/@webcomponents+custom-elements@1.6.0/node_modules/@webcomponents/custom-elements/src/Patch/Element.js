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
import CEState from '../CustomElementState.js';
import * as Utilities from '../Utilities.js';
import PatchChildNode from './Interface/ChildNode.js';
import PatchParentNode from './Interface/ParentNode.js';
import * as Native from './Native.js';
export default function (internals) {
    if (Native.Element_attachShadow) {
        Element.prototype.attachShadow = function (init) {
            const shadowRoot = Native.Element_attachShadow.call(this, init);
            internals.patchNode(shadowRoot);
            this.__CE_shadowRoot = shadowRoot;
            return shadowRoot;
        };
    }
    function patch_innerHTML(destination, baseDescriptor) {
        Object.defineProperty(destination, 'innerHTML', {
            enumerable: baseDescriptor.enumerable,
            configurable: true,
            get: baseDescriptor.get,
            set: function (htmlString) {
                const isConnected = Utilities.isConnected(this);
                // NOTE: In IE11, when using the native `innerHTML` setter, all nodes
                // that were previously descendants of the context element have all of
                // their children removed as part of the set - the entire subtree is
                // 'disassembled'. This work around walks the subtree *before* using the
                // native setter.
                let removedElements = undefined;
                if (isConnected) {
                    removedElements = [];
                    internals.forEachElement(this, (element) => {
                        if (element !== this) {
                            removedElements.push(element);
                        }
                    });
                }
                baseDescriptor.set.call(this, htmlString);
                if (removedElements) {
                    for (let i = 0; i < removedElements.length; i++) {
                        const element = removedElements[i];
                        if (element.__CE_state === CEState.custom) {
                            internals.disconnectedCallback(element);
                        }
                    }
                }
                // Only create custom elements if this element's owner document is
                // associated with the registry.
                if (!this.ownerDocument.__CE_registry) {
                    internals.patchTree(this);
                }
                else {
                    internals.patchAndUpgradeTree(this);
                }
                return htmlString;
            },
        });
    }
    if (Native.Element_innerHTML && Native.Element_innerHTML.get) {
        patch_innerHTML(Element.prototype, Native.Element_innerHTML);
    }
    else if (Native.HTMLElement_innerHTML && Native.HTMLElement_innerHTML.get) {
        patch_innerHTML(HTMLElement.prototype, Native.HTMLElement_innerHTML);
    }
    else {
        internals.addElementPatch(function (element) {
            patch_innerHTML(element, {
                enumerable: true,
                configurable: true,
                // Implements getting `innerHTML` by performing an unpatched `cloneNode`
                // of the element and returning the resulting element's `innerHTML`.
                // TODO: Is this too expensive?
                get: function () {
                    return Native.Node_cloneNode.call(this, true).innerHTML;
                },
                // Implements setting `innerHTML` by creating an unpatched element,
                // setting `innerHTML` of that element and replacing the target
                // element's children with those of the unpatched element.
                set: function (assignedValue) {
                    // NOTE: re-route to `content` for `template` elements.
                    // We need to do this because `template.appendChild` does not
                    // route into `template.content`.
                    const isTemplate = this.localName === 'template';
                    const content = isTemplate
                        ? this.content
                        : this;
                    const rawElement = Native.Document_createElementNS.call(document, this.namespaceURI, this.localName);
                    rawElement.innerHTML = assignedValue;
                    while (content.childNodes.length > 0) {
                        Native.Node_removeChild.call(content, content.childNodes[0]);
                    }
                    const container = isTemplate
                        ? rawElement.content
                        : rawElement;
                    while (container.childNodes.length > 0) {
                        Native.Node_appendChild.call(content, container.childNodes[0]);
                    }
                },
            });
        });
    }
    Element.prototype.setAttribute = function (name, newValue) {
        // Fast path for non-custom elements.
        if (this.__CE_state !== CEState.custom) {
            return Native.Element_setAttribute.call(this, name, newValue);
        }
        const oldValue = Native.Element_getAttribute.call(this, name);
        Native.Element_setAttribute.call(this, name, newValue);
        newValue = Native.Element_getAttribute.call(this, name);
        internals.attributeChangedCallback(this, name, oldValue, newValue, null);
    };
    Element.prototype.setAttributeNS = function (namespace, name, newValue) {
        // Fast path for non-custom elements.
        if (this.__CE_state !== CEState.custom) {
            return Native.Element_setAttributeNS.call(this, namespace, name, newValue);
        }
        const oldValue = Native.Element_getAttributeNS.call(this, namespace, name);
        Native.Element_setAttributeNS.call(this, namespace, name, newValue);
        newValue = Native.Element_getAttributeNS.call(this, namespace, name);
        internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
    };
    Element.prototype.removeAttribute = function (name) {
        // Fast path for non-custom elements.
        if (this.__CE_state !== CEState.custom) {
            return Native.Element_removeAttribute.call(this, name);
        }
        const oldValue = Native.Element_getAttribute.call(this, name);
        Native.Element_removeAttribute.call(this, name);
        if (oldValue !== null) {
            internals.attributeChangedCallback(this, name, oldValue, null, null);
        }
    };
    if (Native.Element_toggleAttribute) {
        Element.prototype.toggleAttribute = function (name, force) {
            // Fast path for non-custom elements.
            if (this.__CE_state !== CEState.custom) {
                return Native.Element_toggleAttribute.call(this, name, force);
            }
            const oldValue = Native.Element_getAttribute.call(this, name);
            const hadAttribute = oldValue !== null;
            const hasAttribute = Native.Element_toggleAttribute.call(this, name, force);
            if (hadAttribute !== hasAttribute) {
                internals.attributeChangedCallback(this, name, oldValue, hasAttribute ? '' : null, null);
            }
            return hasAttribute;
        };
    }
    Element.prototype.removeAttributeNS = function (namespace, name) {
        // Fast path for non-custom elements.
        if (this.__CE_state !== CEState.custom) {
            return Native.Element_removeAttributeNS.call(this, namespace, name);
        }
        const oldValue = Native.Element_getAttributeNS.call(this, namespace, name);
        Native.Element_removeAttributeNS.call(this, namespace, name);
        // In older browsers, `Element#getAttributeNS` may return the empty string
        // instead of null if the attribute does not exist. For details, see;
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttributeNS#Notes
        const newValue = Native.Element_getAttributeNS.call(this, namespace, name);
        if (oldValue !== newValue) {
            internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
        }
    };
    function patch_insertAdjacentElement(destination, baseMethod) {
        destination.insertAdjacentElement = function (position, element) {
            const wasConnected = Utilities.isConnected(element);
            const insertedElement = baseMethod.call(this, position, element);
            if (wasConnected) {
                internals.disconnectTree(element);
            }
            if (Utilities.isConnected(insertedElement)) {
                internals.connectTree(element);
            }
            return insertedElement;
        };
    }
    if (Native.HTMLElement_insertAdjacentElement) {
        patch_insertAdjacentElement(HTMLElement.prototype, Native.HTMLElement_insertAdjacentElement);
    }
    else if (Native.Element_insertAdjacentElement) {
        patch_insertAdjacentElement(Element.prototype, Native.Element_insertAdjacentElement);
    }
    function patch_insertAdjacentHTML(destination, baseMethod) {
        /**
         * Patches and upgrades all nodes which are siblings between `start`
         * (inclusive) and `end` (exclusive). If `end` is `null`, then all siblings
         * following `start` will be patched and upgraded.
         */
        function upgradeNodesInRange(start, end) {
            const nodes = [];
            for (let node = start; node !== end; node = node.nextSibling) {
                nodes.push(node);
            }
            for (let i = 0; i < nodes.length; i++) {
                internals.patchAndUpgradeTree(nodes[i]);
            }
        }
        destination.insertAdjacentHTML = function (position, text) {
            const strPosition = position.toLowerCase();
            if (strPosition === 'beforebegin') {
                const marker = this.previousSibling;
                baseMethod.call(this, strPosition, text);
                upgradeNodesInRange(marker || this.parentNode.firstChild, this);
            }
            else if (strPosition === 'afterbegin') {
                const marker = this.firstChild;
                baseMethod.call(this, strPosition, text);
                upgradeNodesInRange(this.firstChild, marker);
            }
            else if (strPosition === 'beforeend') {
                const marker = this.lastChild;
                baseMethod.call(this, strPosition, text);
                upgradeNodesInRange(marker || this.firstChild, null);
            }
            else if (strPosition === 'afterend') {
                const marker = this.nextSibling;
                baseMethod.call(this, strPosition, text);
                upgradeNodesInRange(this.nextSibling, marker);
            }
            else {
                throw new SyntaxError(`The value provided (${String(strPosition)}) is ` +
                    "not one of 'beforebegin', 'afterbegin', 'beforeend', or 'afterend'.");
            }
        };
    }
    if (Native.HTMLElement_insertAdjacentHTML) {
        patch_insertAdjacentHTML(HTMLElement.prototype, Native.HTMLElement_insertAdjacentHTML);
    }
    else if (Native.Element_insertAdjacentHTML) {
        patch_insertAdjacentHTML(Element.prototype, Native.Element_insertAdjacentHTML);
    }
    PatchParentNode(internals, Element.prototype, {
        prepend: Native.Element_prepend,
        append: Native.Element_append,
    });
    PatchChildNode(internals, Element.prototype, {
        before: Native.Element_before,
        after: Native.Element_after,
        replaceWith: Native.Element_replaceWith,
        remove: Native.Element_remove,
    });
}
//# sourceMappingURL=Element.js.map