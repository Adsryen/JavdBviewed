const { sequence } = require("./functions.js");

const HOT_PATCHER_TYPE = "@@HOTPATCHER";
const NOOP = () => {};

function createNewItem(method) {
    return {
        original: method,
        methods: [method],
        final: false
    };
}

/**
 * Hot patching manager class
 */
class HotPatcher {
    constructor() {
        this._configuration = {
            registry: {},
            getEmptyAction: "null"
        };
        this.__type__ = HOT_PATCHER_TYPE;
    }

    /**
     * Configuration object reference
     * @type {Object}
     * @memberof HotPatcher
     * @readonly
     */
    get configuration() {
        return this._configuration;
    }

    /**
     * The action to take when a non-set method is requested
     * Possible values: null/throw
     * @type {String}
     * @memberof HotPatcher
     */
    get getEmptyAction() {
        return this.configuration.getEmptyAction;
    }

    set getEmptyAction(newAction) {
        this.configuration.getEmptyAction = newAction;
    }

    /**
     * Control another hot-patcher instance
     * Force the remote instance to use patched methods from calling instance
     * @param {HotPatcher} target The target instance to control
     * @param {Boolean=} allowTargetOverrides Allow the target to override patched methods on
     * the controller (default is false)
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     * @throws {Error} Throws if the target is invalid
     */
    control(target, allowTargetOverrides = false) {
        if (!target || target.__type__ !== HOT_PATCHER_TYPE) {
            throw new Error(
                "Failed taking control of target HotPatcher instance: Invalid type or object"
            );
        }
        Object.keys(target.configuration.registry).forEach(foreignKey => {
            if (this.configuration.registry.hasOwnProperty(foreignKey)) {
                if (allowTargetOverrides) {
                    this.configuration.registry[foreignKey] = Object.assign(
                        {},
                        target.configuration.registry[foreignKey]
                    );
                }
            } else {
                this.configuration.registry[foreignKey] = Object.assign(
                    {},
                    target.configuration.registry[foreignKey]
                );
            }
        });
        target._configuration = this.configuration;
        return this;
    }

    /**
     * Execute a patched method
     * @param {String} key The method key
     * @param {...*} args Arguments to pass to the method (optional)
     * @memberof HotPatcher
     * @see HotPatcher#get
     * @returns {*} The output of the called method
     */
    execute(key, ...args) {
        const method = this.get(key) || NOOP;
        return method(...args);
    }

    /**
     * Get a method for a key
     * @param {String} key The method key
     * @returns {Function|null} Returns the requested function or null if the function
     * does not exist and the host is configured to return null (and not throw)
     * @memberof HotPatcher
     * @throws {Error} Throws if the configuration specifies to throw and the method
     * does not exist
     * @throws {Error} Throws if the `getEmptyAction` value is invalid
     */
    get(key) {
        const item = this.configuration.registry[key];
        if (!item) {
            switch (this.getEmptyAction) {
                case "null":
                    return null;
                case "throw":
                    throw new Error(
                        `Failed handling method request: No method provided for override: ${key}`
                    );
                default:
                    throw new Error(
                        `Failed handling request which resulted in an empty method: Invalid empty-action specified: ${
                            this.getEmptyAction
                        }`
                    );
            }
        }
        return sequence(...item.methods);
    }

    /**
     * Check if a method has been patched
     * @param {String} key The function key
     * @returns {Boolean} True if already patched
     * @memberof HotPatcher
     */
    isPatched(key) {
        return !!this.configuration.registry[key];
    }

    /**
     * @typedef {Object} PatchOptions
     * @property {Boolean=} chain - Whether or not to allow chaining execution. Chained
     *  execution allows for attaching multiple callbacks to a key, where the callbacks
     *  will be executed in order of when they were patched (oldest to newest), the
     *  values being passed from one method to another.
     */

    /**
     * Patch a method name
     * @param {String} key The method key to patch
     * @param {Function} method The function to set
     * @param {PatchOptions=} options Patch options
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     */
    patch(key, method, { chain = false } = {}) {
        if (this.configuration.registry[key] && this.configuration.registry[key].final) {
            throw new Error(`Failed patching '${key}': Method marked as being final`);
        }
        if (typeof method !== "function") {
            throw new Error(`Failed patching '${key}': Provided method is not a function`);
        }
        if (chain) {
            // Add new method to the chain
            if (!this.configuration.registry[key]) {
                // New key, create item
                this.configuration.registry[key] = createNewItem(method);
            } else {
                // Existing, push the method
                this.configuration.registry[key].methods.push(method);
            }
        } else {
            // Replace the original
            if (this.isPatched(key)) {
                const { original } = this.configuration.registry[key];
                this.configuration.registry[key] = Object.assign(createNewItem(method), {
                    original
                });
            } else {
                this.configuration.registry[key] = createNewItem(method);
            }
        }
        return this;
    }

    /**
     * Patch a method inline, execute it and return the value
     * Used for patching contents of functions. This method will not apply a patched
     * function if it has already been patched, allowing for external overrides to
     * function. It also means that the function is cached so that it is not
     * instantiated every time the outer function is invoked.
     * @param {String} key The function key to use
     * @param {Function} method The function to patch (once, only if not patched)
     * @param {...*} args Arguments to pass to the function
     * @returns {*} The output of the patched function
     * @memberof HotPatcher
     * @example
     *  function mySpecialFunction(a, b) {
     *      return hotPatcher.patchInline("func", (a, b) => {
     *          return a + b;
     *      }, a, b);
     *  }
     */
    patchInline(key, method, ...args) {
        if (!this.isPatched(key)) {
            this.patch(key, method);
        }
        return this.execute(key, ...args);
    }

    /**
     * Patch a method (or methods) in sequential-mode
     * See `patch()` with the option `chain: true`
     * @see patch
     * @param {String} key The key to patch
     * @param {...Function} methods The methods to patch
     * @returns {HotPatcher} Returns self
     * @memberof HotPatcher
     */
    plugin(key, ...methods) {
        methods.forEach(method => {
            this.patch(key, method, { chain: true });
        });
        return this;
    }

    /**
     * Restore a patched method if it has been overridden
     * @param {String} key The method key
     * @memberof HotPatcher
     */
    restore(key) {
        if (!this.isPatched(key)) {
            throw new Error(`Failed restoring method: No method present for key: ${key}`);
        } else if (typeof this.configuration.registry[key].original !== "function") {
            throw new Error(
                `Failed restoring method: Original method not found or of invalid type for key: ${key}`
            );
        }
        this.configuration.registry[key].methods = [this.configuration.registry[key].original];
    }

    /**
     * Set a method as being final
     * This sets a method as having been finally overridden. Attempts at overriding
     * again will fail with an error.
     * @param {String} key The key to make final
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     */
    setFinal(key) {
        if (!this.configuration.registry.hasOwnProperty(key)) {
            throw new Error(`Failed marking '${key}' as final: No method found for key`);
        }
        this.configuration.registry[key].final = true;
        return this;
    }
}

module.exports = HotPatcher;
