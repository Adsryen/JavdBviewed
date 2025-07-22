# Hot-Patcher
> Hot method patching framework for handling environmental method differences

[![Build Status](https://travis-ci.org/perry-mitchell/hot-patcher.svg?branch=master)](https://travis-ci.org/perry-mitchell/hot-patcher) [![npm version](https://badge.fury.io/js/hot-patcher.svg)](https://www.npmjs.com/package/hot-patcher)

## About
Hot-Patcher provides a simple API to manage patched methods. I found while writing [Buttercup](https://buttercup.pw) that managing overwritten methods between environments (Node/Browser/React-Native) was becoming cumbersome, and having a single _agreed-upon_ method of doing so was the best way to go.

Check out the [API documentation](API.md).

## Installation
Install Hot-Patcher from [npm](https://www.npmjs.com/package/hot-patcher):

```shell
npm install hot-patcher --save
```

## Usage
Hot-Patcher is a class and can simply be instantiated:

```javascript
const HotPatcher = require("hot-patcher");

const hp = new HotPatcher();
```

Hot-Patcher is designed to be used with patchable tools:

```javascript
const HotPatcher = require("hot-patcher");

class MyHelper {
    constructor() {
        this.patcher = new HotPatcher();
    }

    increment(arg) {
        return this.patcher.patchInline("increment", someArg => {
            return someArg + 1;
        }, arg);
    }
}

module.exports = MyHelper;
```

You can then patch methods when required:

```javascript
const MyHelper = require("./MyHelper.js");

function getHelper() {
    const helper = new MyHelper();
    helper.patch("increment", val => val + 2);
    return helper;
}

module.exports = {
    getHelper
};
```

Patched methods can easily be fetched later:

```javascript
const { getSharedPatcher } = require("./patching.js");

const randomString = getSharedPatcher().get("randomString");
randomString(5); // Generates a random string

// Or, execute the method directly:
getSharedPatcher().execute("randomString", 5) // Generates a random string
```

You can check if a method is patched by using `isPatched`: `patcher.isPatched("some method")`.

### Inline patching and execution
Ideally you could wrap function implementation with a patch call, executing it on demand:

```javascript
function add(a, b) {
    return patcher.patchInline("add", (a, b) => a + b, a, b);
}

patcher.isPatched("add"); // false
add(1, 2); // 3
patcher.isPatched("add"); // true
// calling add() multiple times will call the patched method without "re-patching" it
// over and over again..
```

### Plugins - Chaining/Sequencing functions
You can use Hot-Patcher to create sequences of functions:

```javascript
patcher.plugin("increment", x => x * 2, x => x * 2);

patcher.execute("increment", 2); // 8
```

Which is basically syntactic sugar for a regular `patch()` call: 

```javascript
patcher
    .patch("increment", x => x * 2, { chain: true })
    .patch("increment", x => x * 2, { chain: true });

patcher.execute("increment", 2); // 8
```

Executing a regular `patch()` without `chain: true` will overwrite all chained methods with the new method. 

Calling `patch()` with `chain: true` when a method already exists will simply add the new method after the existing:

```javascript
patcher
    .patch("increment", x => x * 2, { chain: false }) // or simply without `chain` specified
    .patch("increment", x => x * 2, { chain: true });

patcher.execute("increment", 2); // still 8
```

## Use Sparingly
The intention of Hot-Patcher is not to push every method into a patching instance, but to provide a common API for specific methods which _require_ patching in some specific environments or in situations where users/consumers are expected to provide their own custom implementations.
