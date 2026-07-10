import { describe, it, test, expect } from 'vitest'
import { runAutoItFunctionCaptureOutput, runAutoItFunction } from '../bridge.js'

// runAutoItFunctionCaptureOutput()
test.each([
	// Inputs and expected outputs
	['tests/sample1.au3', 'WrapString', ['this is a test'], '[[this is a test]]'],
	['tests/sample1.au3', 'WrapString', ['test 2'], '[[test 2]]'],
	['tests/sample1.au3', 'WrapString', ['a\r\nb'], '[[a\r\nb]]'],
	['tests/sample1.au3', 'WrapString', ['a\nb'], '[[a\nb]]'],
	['tests/sample1.au3', 'AddNumbers', [1.1, 2.2], 3.3],
])('runAutoItFunctionCaptureOutput(%j, %j, %j) == %j', (file, func, params, expected) => {
	const result = runAutoItFunctionCaptureOutput(file, func, ...params);
	console.log(result);
	
	expect(result.result).toEqual(expected);
});

