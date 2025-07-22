## Classes

<dl>
<dt><a href="#HotPatcher">HotPatcher</a></dt>
<dd><p>Hot patching manager class</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#PatchOptions">PatchOptions</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="HotPatcher"></a>

## HotPatcher
Hot patching manager class

**Kind**: global class  

* [HotPatcher](#HotPatcher)
    * [.configuration](#HotPatcher+configuration) : <code>Object</code>
    * [.getEmptyAction](#HotPatcher+getEmptyAction) : <code>String</code>
    * [.control(target, [allowTargetOverrides])](#HotPatcher+control) ⇒ [<code>HotPatcher</code>](#HotPatcher)
    * [.execute(key, ...args)](#HotPatcher+execute) ⇒ <code>\*</code>
    * [.get(key)](#HotPatcher+get) ⇒ <code>function</code> \| <code>null</code>
    * [.isPatched(key)](#HotPatcher+isPatched) ⇒ <code>Boolean</code>
    * [.patch(key, method, [options])](#HotPatcher+patch) ⇒ [<code>HotPatcher</code>](#HotPatcher)
    * [.patchInline(key, method, ...args)](#HotPatcher+patchInline) ⇒ <code>\*</code>
    * [.plugin(key, ...methods)](#HotPatcher+plugin) ⇒ [<code>HotPatcher</code>](#HotPatcher)
    * [.restore(key)](#HotPatcher+restore)
    * [.setFinal(key)](#HotPatcher+setFinal) ⇒ [<code>HotPatcher</code>](#HotPatcher)

<a name="HotPatcher+configuration"></a>

### hotPatcher.configuration : <code>Object</code>
Configuration object reference

**Kind**: instance property of [<code>HotPatcher</code>](#HotPatcher)  
**Read only**: true  
<a name="HotPatcher+getEmptyAction"></a>

### hotPatcher.getEmptyAction : <code>String</code>
The action to take when a non-set method is requested
Possible values: null/throw

**Kind**: instance property of [<code>HotPatcher</code>](#HotPatcher)  
<a name="HotPatcher+control"></a>

### hotPatcher.control(target, [allowTargetOverrides]) ⇒ [<code>HotPatcher</code>](#HotPatcher)
Control another hot-patcher instance
Force the remote instance to use patched methods from calling instance

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: [<code>HotPatcher</code>](#HotPatcher) - Returns self  
**Throws**:

- <code>Error</code> Throws if the target is invalid


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | [<code>HotPatcher</code>](#HotPatcher) |  | The target instance to control |
| [allowTargetOverrides] | <code>Boolean</code> | <code>false</code> | Allow the target to override patched methods on the controller (default is false) |

<a name="HotPatcher+execute"></a>

### hotPatcher.execute(key, ...args) ⇒ <code>\*</code>
Execute a patched method

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: <code>\*</code> - The output of the called method  
**See**: HotPatcher#get  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The method key |
| ...args | <code>\*</code> | Arguments to pass to the method (optional) |

<a name="HotPatcher+get"></a>

### hotPatcher.get(key) ⇒ <code>function</code> \| <code>null</code>
Get a method for a key

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: <code>function</code> \| <code>null</code> - Returns the requested function or null if the function
does not exist and the host is configured to return null (and not throw)  
**Throws**:

- <code>Error</code> Throws if the configuration specifies to throw and the method
does not exist
- <code>Error</code> Throws if the `getEmptyAction` value is invalid


| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The method key |

<a name="HotPatcher+isPatched"></a>

### hotPatcher.isPatched(key) ⇒ <code>Boolean</code>
Check if a method has been patched

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: <code>Boolean</code> - True if already patched  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The function key |

<a name="HotPatcher+patch"></a>

### hotPatcher.patch(key, method, [options]) ⇒ [<code>HotPatcher</code>](#HotPatcher)
Patch a method name

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: [<code>HotPatcher</code>](#HotPatcher) - Returns self  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The method key to patch |
| method | <code>function</code> | The function to set |
| [options] | [<code>PatchOptions</code>](#PatchOptions) | Patch options |

<a name="HotPatcher+patchInline"></a>

### hotPatcher.patchInline(key, method, ...args) ⇒ <code>\*</code>
Patch a method inline, execute it and return the value
Used for patching contents of functions. This method will not apply a patched
function if it has already been patched, allowing for external overrides to
function. It also means that the function is cached so that it is not
instantiated every time the outer function is invoked.

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: <code>\*</code> - The output of the patched function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The function key to use |
| method | <code>function</code> | The function to patch (once, only if not patched) |
| ...args | <code>\*</code> | Arguments to pass to the function |

**Example**  
```js
function mySpecialFunction(a, b) {
     return hotPatcher.patchInline("func", (a, b) => {
         return a + b;
     }, a, b);
 }
```
<a name="HotPatcher+plugin"></a>

### hotPatcher.plugin(key, ...methods) ⇒ [<code>HotPatcher</code>](#HotPatcher)
Patch a method (or methods) in sequential-mode
See `patch()` with the option `chain: true`

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: [<code>HotPatcher</code>](#HotPatcher) - Returns self  
**See**: patch  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to patch |
| ...methods | <code>function</code> | The methods to patch |

<a name="HotPatcher+restore"></a>

### hotPatcher.restore(key)
Restore a patched method if it has been overridden

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The method key |

<a name="HotPatcher+setFinal"></a>

### hotPatcher.setFinal(key) ⇒ [<code>HotPatcher</code>](#HotPatcher)
Set a method as being final
This sets a method as having been finally overridden. Attempts at overriding
again will fail with an error.

**Kind**: instance method of [<code>HotPatcher</code>](#HotPatcher)  
**Returns**: [<code>HotPatcher</code>](#HotPatcher) - Returns self  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to make final |

<a name="PatchOptions"></a>

## PatchOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [chain] | <code>Boolean</code> | Whether or not to allow chaining execution. Chained  execution allows for attaching multiple callbacks to a key, where the callbacks  will be executed in order of when they were patched (oldest to newest), the  values being passed from one method to another. |

