# Node AutoIt Bridge

Call AutoIt3 scripts and functions directly from your Node.js application. Pass parameters, get return values — all without leaving JavaScript.

## What is this?

AutoIt3 is a powerful Windows automation language. This bridge lets you write your automation logic in `.au3` files and call it from Node.js as easily as any other function.

```js
import { runAutoItFunction } from 'node-autoit-bridge';

const result = await runAutoItFunction('my-scripts/window.au3', 'GetWindowTitle');
console.log(result); // "Untitled - Notepad"
```

## Prerequisites

- **Windows only** — AutoIt3 is Windows-native (although it can be run in Wine on Mac/Linux in some cases)
- **AutoIt3.exe** installed on the same machine. The script will look for it at `C:\Program Files (x86)\AutoIt3\AutoIt3.exe`, but you can configure an alternative path if needed.
- **Node.js** 20.11+ (uses `import.meta.dirname`, added in Node 20.11 / 21.2)

## Installation

You can install this from npm:

```bash
npm install node-autoit-bridge
```

Or [download a ZIP file here](https://github.com/SimonEast/node-autoit-bridge/archive/refs/heads/main.zip), and import it into your project.

## Quick Start

### 1. Write an AutoIt script

Create `greet.au3`:

```autoit
Func Greet($name)
    Return "Hello, " & $name & "!"
EndFunc
```

### 2. Call it from Node.js

```js
import { runAutoItFunction } from 'node-autoit-bridge';

// Specify the path to your AutoIt script, the function name, and any parameters
const greeting = await runAutoItFunction('greet.au3', 'Greet', 'World');
console.log(greeting); // "Hello, World!"
```

That's it! 🎉

To use `await` in your top-level code, make sure your file is an ES module (e.g., `package.json` has `type: "module"`, or use `.mjs` extension), or wrap it in an async function.

You can pass strings, numbers, booleans, arrays, and objects/maps as parameters, and the return value can be any of those types as well.

## Key functions

### `runAutoItFunction(file, functionName, ...params)`

The simplest way to call an AutoIt function. Returns a Promise that resolves to the result.

```js
import { runAutoItFunction } from 'node-autoit-bridge';

// Call AddNumbers(5, 10) in math.au3
const sum = await runAutoItFunction('math.au3', 'AddNumbers', 5, 10);
console.log(sum); // 15

// Strings work too
const title = await runAutoItFunction('window.au3', 'GetWindowTitle');
console.log(title); // "My Application"
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `string` | Path to the `.au3` file, relative to your project root |
| `functionName` | `string` | Name of the AutoIt function to call |
| `...params` | `any` | Arguments to pass to the function (strings, numbers, booleans, arrays, objects) |

**Returns:** `Promise<any>` — Resolves to the value returned by your AutoIt function (string, number, array, or object).

---

### `runAutoItFunctionDetailed(file, functionName, ...params)`

Same as above, but returns extra details about the execution:

```js
import { runAutoItFunctionDetailed } from 'node-autoit-bridge';

const details = await runAutoItFunctionDetailed('math.au3', 'AddNumbers', 5, 10);
// {
//   result: 15,               ← The function's return value
//   output: "...",            ← Any ConsoleWrite output from the script
//   time: 0.23                ← Execution time in seconds
// }
```

---

### `runAutoItCode(au3Code)`

Run raw AutoIt code as a string. Returns a Promise. Useful for one-off scripts or when you don't need a separate `.au3` file. You'll still get the console output as one long string, and the execution time.

```js
import { runAutoItCode } from 'node-autoit-bridge';

const result = await runAutoItCode(`
    Local $sum = 1 + 2 + 3
    ConsoleWrite($sum)
`);
// { output: "6", time: 0.12 }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `au3Code` | `string` | Raw AutoIt3 code to execute |

**Returns:** `Promise<{ output, time }>` — the console output and execution time.

AutoIt's `ConsoleWrite()` function does not handle UTF-8 characters well (such as curly quotes, emojis, etc.), so if you need to return a value from the code, it's recommended that you wrap it in a function and call `runAutoItFunction()` instead. You'll get the return value directly, with arrays, objects and UTF-8 characters handled correctly, instead of having to parse the console output manually.

## How It Works

1. Your AutoIt code or function call are written into a **temporary `.au3` file**
2. Parameters are JSON-encoded and decoded via Sylvan86's `_JSON_Parse()` function for safe handling of strings, arrays, and objects
3. `AutoIt3.exe "tempScript_<unique_id>.au3"` is executed to run the temp script
4. The return value is captured, converted back to JSON, printed to the console, and returned to your JavaScript

No COM objects (which are synchronous and blocking), no persistent processes — just clean, stateless calls. All functions are asynchronous and non-blocking from the Node.js side. You can even run multiple AutoIt functions in parallel, and each will have its own temporary script file.

## Examples

### Passing arrays and objects

```js
// AutoIt function: Func ProcessItems($items) ... EndFunc
const items = ['apple', 'banana', 'cherry'];
await runAutoItFunction('inventory.au3', 'ProcessItems', items);

// Objects work too
const config = { timeout: 5000, retries: 3 };
await runAutoItFunction('config.au3', 'ApplyConfig', config);
```

### Reading console output

If your AutoIt script uses `ConsoleWrite()`, that output is available in the `output` property:

```js
const { result, output } = await runAutoItFunctionDetailed('debug.au3', 'DoWork');
console.log('AutoIt said:', output);
console.log('Result was:', result);
```

Just remember that AutoIt's `ConsoleWrite()` does not handle UTF-8 characters well, so if you need to handle special characters, use return a value from the function instead of outputting directly to the console. Or see [`_ConsoleWriteUnicode()`](au3-utilities/ConsoleWriteUnicode.au3).

### Error handling

```js
try {
    const result = await runAutoItFunction('scripts.au3', 'RiskyOperation');
} catch (err) {
    console.error('AutoIt call failed:', err.message);
}
```

## Configuration

If you need to customize the AutoIt path, timeout, or enable debug logging, you can do so via the `config` object. Here are the options and their defaults:

```js
import { config } from 'node-autoit-bridge';

config.autoItPath = 'C:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe';
config.timeout = 4000;      // milliseconds
config.debug = false;       // enable debug logging
```

All AutoIt scripts are executed with a timeout (default 4 seconds). If the script takes longer, it will be terminated and an error will be thrown.

## Project Structure

```
node-autoit-bridge/
├── bridge.js                    ← Main library
├── au3-utilities/
│   ├── json.au3                 ← JSON UDF for AutoIt (parameter serialization)
│   └── ConsoleWriteUnicode.au3  ← Improved ConsoleWrite for UTF-8 output
├── tests/
│   ├── bridge.test.js           ← Test suite
│   └── sample1.au3              ← Sample AutoIt script used in tests
└── package.json
```

## Unit Tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and verify both raw code execution and function calls with various parameter types.

## License

MIT © Simon East

## Credits

- [AutoIt3](https://www.autoitscript.com/) — Windows automation language
- [json.au3](https://github.com/Sylvan86/autoit-json-udf) — JSON UDF by AspirinJunkie & SOLVE-SMART (WTFPL)
