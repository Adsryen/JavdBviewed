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
import CustomElementInternals from './CustomElementInternals.js';
interface ElementConstructor {
    new (): HTMLElement;
    observedAttributes?: Array<string>;
}
declare type ConstructorGetter = () => ElementConstructor;
/**
 * @unrestricted
 */
export default class CustomElementRegistry {
    private readonly _localNameToConstructorGetter;
    private readonly _localNameToDefinition;
    private readonly _constructorToDefinition;
    private _elementDefinitionIsRunning;
    private readonly _internals;
    private readonly _whenDefinedDeferred;
    /**
     * The default flush callback triggers the document walk synchronously.
     */
    private _flushCallback;
    private _flushPending;
    /**
     * A map from `localName`s of definitions that were defined *after* the
     * last flush to unupgraded elements matching that definition, in document
     * order. Entries are added to this map when a definition is registered,
     * but the list of elements is only populated during a flush after which
     * all of the entries are removed. DO NOT edit outside of `#_flush`.
     */
    private readonly _unflushedLocalNames;
    private readonly _documentConstructionObserver;
    constructor(internals: CustomElementInternals);
    polyfillDefineLazy(localName: string, constructorGetter: ConstructorGetter): void;
    define(localName: string, constructor: Function): void;
    internal_assertCanDefineLocalName(localName: string): void;
    internal_reifyDefinition(localName: string, constructor: ElementConstructor): {
        localName: string;
        constructorFunction: ElementConstructor;
        connectedCallback: (() => void) | undefined;
        disconnectedCallback: (() => void) | undefined;
        adoptedCallback: (() => void) | undefined;
        attributeChangedCallback: ((name: string, oldValue?: string | null | undefined, newValue?: string | null | undefined, namespace?: string | null | undefined) => void) | undefined;
        observedAttributes: string[];
        constructionStack: (HTMLElement | {
            _alreadyConstructedMarker: never;
        })[];
    };
    upgrade(node: Node): void;
    private _flush;
    get(localName: string): undefined | {
        new (): HTMLElement;
    };
    whenDefined(localName: string): Promise<void>;
    polyfillWrapFlushCallback(outer: (fn: () => void) => void): void;
    internal_localNameToDefinition(localName: string): CustomElementDefinition | undefined;
    internal_constructorToDefinition(constructor: ElementConstructor): CustomElementDefinition | undefined;
}
export {};
