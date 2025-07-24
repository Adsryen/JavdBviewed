# Layerr
> Errors, with.. layers..

A NodeJS and Web `Error` wrapping utility, based heavily on [VError](https://github.com/joyent/node-verror), but without all the extras and dependencies on Node core utilities. Written in Typescript, compiled to JavaScript and suitable for bundling in the browser.

## Installation

Install by running: `npm install layerr`.

## Usage

Use it as a regular error:

```javascript
const { Layerr } = require("layerr");

throw new Layerr("Test error");
```

Or use it to wrap errors:

```javascript
doSomething().catch(err => {
    throw new Layerr(err, "Failed doing something");
});
```

Layerr's can have info attached:

```javascript
const { Layerr } = require("layerr");

function somethingElse() {
    throw new Layerr({
        info: {
            code: 123
        }
    }, "Problem");
}

somethingElse().catch((err: Layerr) => {
    const { code } = Layerr.info(err);
    // code === 123
});
```
