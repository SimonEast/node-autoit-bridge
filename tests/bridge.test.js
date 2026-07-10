import { describe, it, test, expect } from 'vitest'
import { runAutoItCode, runAutoItFunction } from '../bridge.js'

describe('runAutoItCode()', () => {
	
	test.each([
		['', '"Hello World"', 'Hello World'],
		['', '"Hello" & " World"', 'Hello World'],
		['', '1+2+3', '6'],
		[`Func Sum($a, $b)
			Return $a + $b
		EndFunc`,
			'Sum(1.1,2.2)', '3.3'],
	])('runAutoItCode(%j + %j) == %j', (pre, code, expected) => {
		const au3Code = `
			${pre}
			ConsoleWrite(${code})
		`;
		expect(runAutoItCode(au3Code)).toMatchObject({ output: expected });
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
	])('runAutoItFunction(%j, %j, %j) == %j', (file, func, params, expected) => {
		const result = runAutoItFunction(file, func, ...params);
		console.log(result);
		
		expect(result).toEqual(expected);
	});
});
