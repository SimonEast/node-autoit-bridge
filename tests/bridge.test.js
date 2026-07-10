import { describe, it, test, expect } from 'vitest'
import { runAutoItCode, runAutoItFunction, runAutoItFunctionDetailed } from '../bridge.js'

describe('runAutoItCode()', () => {

	test.each([
		// Basic ConsoleWrite() calls to check that the bridge is working and capturing output correctly
		['', '"Hello World"', 'Hello World'],
		['', '"Hello" & " World"', 'Hello World'],
		['', '1+2+3', '6'],
		[`Func Sum($a, $b)
			Return $a + $b
		EndFunc`, 'Sum(1.1,2.2)', '3.3'],
	])('runAutoItCode(%j + %j) == %j', async (pre, code, expected) => {
		const au3Code = `
			${pre}
			ConsoleWrite(${code})
		`;
		const result = await runAutoItCode(au3Code);
		expect(result).toMatchObject({ output: expected });
	});

	test('errors should throw an exception', async () => {
		await expect(runAutoItCode(`NonExistentFunction()`)).rejects.toThrow();
		await expect(runAutoItCode(`1+x`)).rejects.toThrow();
	});

});

describe('runAutoItFunction()', () => {
	test.each([
		// Inputs and expected outputs
		['tests/sample1.au3', 'WrapString', ['this is a test'], '[[this is a test]]'],
		['tests/sample1.au3', 'WrapString', ['test 2'], '[[test 2]]'],
		['tests/sample1.au3', 'WrapString', ['a\r\nb'], '[[a\r\nb]]'],
		['tests/sample1.au3', 'WrapString', ['a\nb'], '[[a\nb]]'],
		['tests/sample1.au3', 'AddNumbers', [1.1, 2.2], 3.3],
		['tests/sample1.au3', 'ArrayAppend', [[1, 2, 3], 4], [1, 2, 3, 4]],
		['tests/sample1.au3', 'ArrayAppend', [[1, [2,2], 3], 4], [1, [2, 2], 3, 4]],
		['tests/sample1.au3', 'ArrayAppend', [['1', '2', '3'], '4'], ['1', '2', '3', '4']],
		['tests/sample1.au3', 'ArrayAppend', [[{a:1}, {a:2}], {a:3}], [{a:1}, {a:2}, {a:3}]],
		['tests/sample1.au3', 'ModifyMap', [{ key: 'value', array: [1,2] }], { key: 'value', array: [1,2], newKey: 'newValue' }],
	])('runAutoItFunction(%j, %j, %j) == %j', async (file, func, params, expected) => {
		const result = await runAutoItFunction(file, func, ...params);
		expect(result).toEqual(expected);
	});

	test('errors should throw an exception', async () => {
		await expect(runAutoItFunction('NonExistentFile.au3', 'NonExistentFunction')).rejects.toThrow();
		await expect(runAutoItFunction('tests/sample1.au3', 'NonExistentFunction')).rejects.toThrow();
	});
});
