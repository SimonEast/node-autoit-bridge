import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
const execFileAsync = promisify(execFile);

export const config = {
    autoItPath: `c:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe`,
    timeout: 4000, // milliseconds
};

/**
 * Runs raw AutoIt3 code by writing it to a temporary .au3 file and executing it.
 * Returns a Promise that resolves to an object containing:
 *   - output: The full console output from the AutoIt script execution
 *   - time: The time taken to execute the function, in seconds
 *
 * Use runAutoItFunction() if you only want the result of a function call.
 *
 * How this function works:
 *
 * 1. Creates a temporary .au3 file based on current timestamp that contains the
 *    provided AutoIt code.
 * 2. Executes `AutoIt3.exe tempScript.au3` asynchronously
 * 3. Captures full console output
 *
 * TODO:
 *   - Include a copy of AutoIt.exe? And option to configure path
 *   - Also return @error value
 *
 * @param {string} au3Code - Raw AutoIt3 code to execute
 * @returns {Promise<{output: string, time: number}>} An object containing the
 *   full console output and execution time in seconds.
 */
export async function runAutoItCode(au3Code) {

    // Create a temporary .au3 file to execute the function call
    // Use a timestamp to ensure unique file names and avoid collisions
    // (milliseconds are included to reduce the chance of collisions)
    const tempFilePath = join(tmpdir(), `tempScript_${Date.now()}.au3`);

    // We'll #include the JSON lib, if it's used
    // This is always relative to this bridge.js file, not the target .au3 file
    const pathToJsonLib = join(import.meta.dirname, 'au3-utilities', 'json.au3');
    
    // Create the content of the temporary .au3 file
    let tempFileContent = `
      #NoTrayIcon
      Opt("TrayIconHide", 1) ; Hide the AutoIt tray icon for cleaner execution
      ${au3Code.includes('_JSON_') ? `#include "${pathToJsonLib}"` : ''}
      ${au3Code}
   `;

    // Write the temporary .au3 file
    await writeFile(tempFilePath, tempFileContent);

    const startTime = performance.now();

    try {
        // Run AutoIt3.exe with the temporary .au3 file and capture the output
        // Paths do not need to be quoted because execFile handles that automatically
        const { stdout } = await execFileAsync(
            config.autoItPath, [`/ErrorStdOut`, tempFilePath],
            { encoding: 'utf-8', timeout: config.timeout }
        );
        const time = Math.round(performance.now() - startTime) / 1000;
        return { output: stdout, time };

    } catch (error) {
        // We could reach here under two scenarios:
        // 1. The AutoIt script executed but returned a non-zero exit code
        // 2. The AutoIt script did not execute at all (AutoIt not found, etc.)
        throw new Error(
            `Error executing AutoIt script: ${error.message}. Output: \n${error.stdout || error.stderr}`,
            { cause: error }
        );

    } finally {
        // Clean up the temporary file regardless of outcome
        await unlink(tempFilePath).catch(() => {});
    }
}

/**
 * Run an AutoIt function and return the result of the function call.
 *
 * If you need the full console output or execution time, use
 * runAutoItFunctionDetailed() instead.
 *
 * @param {string} file - The path to the .au3 file containing the function to call, relative to the current working directory
 * @param {string} functionName - The name of the function to call within the .au3 file
 * @param  {...any} params - Optional parameters to pass to the AutoIt function
 * @returns {Promise<any>} The result of the AutoIt function, which could be a
 *   string, number, array, or object, depending on what the function returns.
 *   If the function does not return anything, this will be undefined.
 */
export async function runAutoItFunction(file, functionName, ...params) {
    const { result } = await runAutoItFunctionDetailed(file, functionName, ...params);
    return result;
}

/**
 * Run an AutoIt function and return detailed information about the execution,
 * including the result of the function call, the full console output, and the
 * time taken to execute.
 *
 * TODO:
 *   - Maybe allow multiple function calls to avoid running the exe multiple times
 *   - Also return @error value
 *
 * @param {string} file - The path to the .au3 file containing the function,
 *   relative to the current working directory
 * @param {string} functionName - The name of the function to call
 * @param {...any} params - Optional parameters to pass to the AutoIt function
 * @returns {Promise<{result: any, output: string, time: number}>} An object containing:
 *   - result: The parsed result of the function call (if any)
 *   - output: Any other console output from the AutoIt script execution
 *   - time: The time taken to execute the function, in seconds
 */
export async function runAutoItFunctionDetailed(file, functionName, ...params) {

    // Create the content of the temporary .au3 file
    // Relative to the current working directory
    const pathToTargetFile = join(process.cwd(), file);

    // Generate the list of parameters for the function call, wrapping each one in
    // _JSON_Parse to support arrays, objects, line returns, and special characters
    const functionParams = params.map(p =>
        '_JSON_Parse("' + JSON.stringify(p).replaceAll('"', '""') + '")'
    ).join(', ');

    // Full function call string, e.g. MyFunction(_JSON_Parse("param1"), _JSON_Parse("param2"))
    const functionCall = `${functionName}(${functionParams})`;

    // Generate the AutoIt code to be executed
    // JSON lib will be #included in runAutoItCode()
    const au3Code = `
      #include "${pathToTargetFile}"
      Local $result = ${functionCall}
      ConsoleWrite("FUNCTION_OUTPUT_START" & _JSON_Generate($result) & "FUNCTION_OUTPUT_END")
   `;

    // For debugging, you can log the temp file content
    // console.log('Generated AutoIt script content:\n', au3Code);

    const { output, time } = await runAutoItCode(au3Code);

    // Extract the function output from the rest of the console output
    const match = output.match(/FUNCTION_OUTPUT_START(.*?)FUNCTION_OUTPUT_END/s);

    if (!match)
        throw new Error('Function output not found in console output');

    const functionOutput = JSON.parse(match[1]);
    return {
        output: output.split('FUNCTION_OUTPUT_START')[0], // everything before the function output
        result: functionOutput,
        time
    };
}

// Perform a test run
// console.log(import.meta.resolve('./au3/json.au3'));
// console.log(__dirname);

// const result = runAutoItFunctionCaptureOutput('./tests/sample1.au3', 'Sample', 'Hello, World!', 42, 3.14);
// console.log('Function result:', result);
// console.log('Function result:', result.result);
