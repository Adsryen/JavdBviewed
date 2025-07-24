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
export default class CustomElementInternals {
    private readonly _patchesNode;
    private readonly _patchesElement;
    private _hasPatches;
    readonly shadyDomFastWalk: boolean;
    readonly useDocumentConstructionObserver: boolean;
    constructor(options: {
        shadyDomFastWalk: boolean;
        noDocumentConstructionObserver: boolean;
    });
    forEachElement(node: Node, callback: (elem: Element) => void, visitedImports?: Set<Node>): void;
    addNodePatch(patch: (node: Node) => void): void;
    addElementPatch(patch: (element: Element) => void): void;
    patchTree(node: Node): void;
    patchNode(node: Node): void;
    patchElement(element: Element): void;
    connectTree(root: Node): void;
    disconnectTree(root: Node): void;
    /**
     * Upgrades all uncustomized custom elements at and below a root node for
     * which there is a definition. When custom element reaction callbacks are
     * assumed to be called synchronously (which, by the current DOM / HTML spec
     * definitions, they are *not*), callbacks for both elements customized
     * synchronously by the parser and elements being upgraded occur in the same
     * relative order.
     *
     * NOTE: This function, when used to simulate the construction of a tree
     * that is already created but not customized (i.e. by the parser), does
     * *not* prevent the element from reading the 'final' (true) state of the
     * tree. For example, the element, during truly synchronous parsing /
     * construction would see that it contains no children as they have not yet
     * been inserted. However, this function does not modify the tree, the
     * element will (incorrectly) have children. Additionally, self-modification
     * restrictions for custom element constructors imposed by the DOM spec are
     * *not* enforced.
     *
     *
     * The following nested list shows the steps extending down from the HTML
     * spec's parsing section that cause elements to be synchronously created
     * and upgraded:
     *
     * The "in body" insertion mode:
     * https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
     * - Switch on token:
     *   .. other cases ..
     *   -> Any other start tag
     *      - [Insert an HTML element](below) for the token.
     *
     * Insert an HTML element:
     * https://html.spec.whatwg.org/multipage/syntax.html#insert-an-html-element
     * - Insert a foreign element for the token in the HTML namespace:
     *   https://html.spec.whatwg.org/multipage/syntax.html#insert-a-foreign-element
     *   - Create an element for a token:
     *     https://html.spec.whatwg.org/multipage/syntax.html#create-an-element-for-the-token
     *     - Will execute script flag is true?
     *       - (Element queue pushed to the custom element reactions stack.)
     *     - Create an element:
     *       https://dom.spec.whatwg.org/#concept-create-element
     *       - Sync CE flag is true?
     *         - Constructor called.
     *         - Self-modification restrictions enforced.
     *       - Sync CE flag is false?
     *         - (Upgrade reaction enqueued.)
     *     - Attributes appended to element.
     *       (`attributeChangedCallback` reactions enqueued.)
     *     - Will execute script flag is true?
     *       - (Element queue popped from the custom element reactions stack.
     *         Reactions in the popped stack are invoked.)
     *   - (Element queue pushed to the custom element reactions stack.)
     *   - Insert the element:
     *     https://dom.spec.whatwg.org/#concept-node-insert
     *     - Shadow-including descendants are connected. During parsing
     *       construction, there are no shadow-*excluding* descendants.
     *       However, the constructor may have validly attached a shadow
     *       tree to itself and added descendants to that shadow tree.
     *       (`connectedCallback` reactions enqueued.)
     *   - (Element queue popped from the custom element reactions stack.
     *     Reactions in the popped stack are invoked.)
     */
    patchAndUpgradeTree(root: Node, options?: {
        visitedImports?: Set<Node>;
        upgrade?: (elem: HTMLElement) => void;
    }): void;
    upgradeReaction(element: HTMLElement): void;
    /**
     * @see https://html.spec.whatwg.org/multipage/custom-elements.html#concept-upgrade-an-element
     */
    private _upgradeAnElement;
    connectedCallback(element: Element): void;
    disconnectedCallback(element: Element): void;
    attributeChangedCallback(element: Element, name: string, oldValue?: string | null, newValue?: string | null, namespace?: string | null): void;
    /**
     * Runs HTML's 'look up a custom element definition', excluding the namespace
     * check.
     *
     * @see https://html.spec.whatwg.org/multipage/custom-elements.html#look-up-a-custom-element-definition
     */
    private _lookupACustomElementDefinition;
    /**
     * Runs the DOM's 'create an element'. If namespace is not null, then the
     * native `createElementNS` is used. Otherwise, `createElement` is used.
     *
     * Note, the template polyfill only wraps `createElement`, preventing this
     * function from using `createElementNS` in all cases.
     *
     * @see https://dom.spec.whatwg.org/#concept-create-element
     */
    createAnElement(doc: Document, localName: string, namespace: string | null): Element;
    /**
     * Runs the DOM's 'report the exception' algorithm.
     *
     * @see https://html.spec.whatwg.org/multipage/webappapis.html#report-the-exception
     */
    reportTheException(arg: unknown): void;
}
