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
export declare const Document_createElement: {
    <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions | undefined): HTMLElementTagNameMap[K];
    <K_1 extends keyof HTMLElementDeprecatedTagNameMap>(tagName: K_1, options?: ElementCreationOptions | undefined): HTMLElementDeprecatedTagNameMap[K_1];
    (tagName: string, options?: ElementCreationOptions | undefined): HTMLElement;
};
export declare const Document_createElementNS: {
    (namespaceURI: "http://www.w3.org/1999/xhtml", qualifiedName: string): HTMLElement;
    <K extends keyof SVGElementTagNameMap>(namespaceURI: "http://www.w3.org/2000/svg", qualifiedName: K): SVGElementTagNameMap[K];
    (namespaceURI: "http://www.w3.org/2000/svg", qualifiedName: string): SVGElement;
    (namespaceURI: string | null, qualifiedName: string, options?: ElementCreationOptions | undefined): Element;
    (namespace: string | null, qualifiedName: string, options?: string | ElementCreationOptions | undefined): Element;
};
export declare const Document_importNode: <T extends Node>(node: T, deep?: boolean | undefined) => T;
export declare const Document_prepend: (...nodes: (string | Node)[]) => void;
export declare const Document_append: (...nodes: (string | Node)[]) => void;
export declare const DocumentFragment_prepend: (...nodes: (string | Node)[]) => void;
export declare const DocumentFragment_append: (...nodes: (string | Node)[]) => void;
export declare const Node_cloneNode: (deep?: boolean | undefined) => Node;
export declare const Node_appendChild: <T extends Node>(node: T) => T;
export declare const Node_insertBefore: <T extends Node>(node: T, child: Node | null) => T;
export declare const Node_removeChild: <T extends Node>(child: T) => T;
export declare const Node_replaceChild: <T extends Node>(node: Node, child: T) => T;
export declare const Node_textContent: PropertyDescriptor | undefined;
export declare const Element_attachShadow: (init: ShadowRootInit) => ShadowRoot;
export declare const Element_innerHTML: PropertyDescriptor | undefined;
export declare const Element_getAttribute: (qualifiedName: string) => string | null;
export declare const Element_setAttribute: (qualifiedName: string, value: string) => void;
export declare const Element_removeAttribute: (qualifiedName: string) => void;
export declare const Element_toggleAttribute: (qualifiedName: string, force?: boolean | undefined) => boolean;
export declare const Element_getAttributeNS: (namespace: string | null, localName: string) => string | null;
export declare const Element_setAttributeNS: (namespace: string | null, qualifiedName: string, value: string) => void;
export declare const Element_removeAttributeNS: (namespace: string | null, localName: string) => void;
export declare const Element_insertAdjacentElement: (where: InsertPosition, element: Element) => Element | null;
export declare const Element_insertAdjacentHTML: (position: InsertPosition, text: string) => void;
export declare const Element_prepend: (...nodes: (string | Node)[]) => void;
export declare const Element_append: (...nodes: (string | Node)[]) => void;
export declare const Element_before: (...nodes: (string | Node)[]) => void;
export declare const Element_after: (...nodes: (string | Node)[]) => void;
export declare const Element_replaceWith: (...nodes: (string | Node)[]) => void;
export declare const Element_remove: () => void;
export declare const HTMLElement: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare const HTMLElement_innerHTML: PropertyDescriptor | undefined;
export declare const HTMLElement_insertAdjacentElement: (where: InsertPosition, element: Element) => Element | null;
export declare const HTMLElement_insertAdjacentHTML: (position: InsertPosition, text: string) => void;
