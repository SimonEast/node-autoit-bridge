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
- **AutoIt3** installed at `C:\Program Files (x86)\AutoIt3\AutoIt3.exe` (the default location)
- **Node.js** 20.11+ (uses `import.meta.dirname`, added in Node 20.11 / 21.2)

## Installation

Since this package isn't on npm yet, install it directly from GitHub:

```bash
npm install github:SimonEast/node-autoit-bridge
```

Or clone it manually:

```bash
git clone https://github.com/SimonEast/node-autoit-bridge.git
```

Then import from the local path in your project.

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

const greeting = await runAutoItFunction('greet.au3', 'Greet', 'World');
console.log(greeting); // "Hello, World!"
```

That's it! 🎉

## API

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

Run raw AutoIt code as a string. Returns a Promise. Useful for one-off scripts or when you don't need a separate `.au3` file.

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

## How It Works

1. Your AutoIt code or function call are written into a **temporary `.au3` file**
2. Parameters are JSON-encoded and decoded via Sylvan86's `_JSON_Parse()` function for safe handling of strings, arrays, and objects
3. `AutoIt3.exe` executes the temp script
4. The return value is captured, converted back to JSON, printed to the console, and returned to your JavaScript

No COM objects (which are synchronous and cause blocking), no persistent processes — just clean, stateless calls.

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

### Error handling

```js
try {
    const result = await runAutoItFunction('scripts.au3', 'RiskyOperation');
} catch (err) {
    console.error('AutoIt call failed:', err.message);
}
```

## Configuration

The bridge expects AutoIt3 to be installed at its default location:

```
C:\Program Files (x86)\AutoIt3\AutoIt3.exe
```

If you installed AutoIt3 elsewhere, you'll need to edit the path in `bridge.js` (line ~43) — or better yet, submit a PR to make this configurable!

## Project Structure

```
node-autoit-bridge/
├── bridge.js              ← Main library
├── au3-utilities/
│   └── json.au3           ← JSON UDF for AutoIt (parameter serialization)
├── tests/
│   ├── bridge.test.js     ← Test suite
│   └── sample1.au3        ← Sample AutoIt script used in tests
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
