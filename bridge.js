import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Runs an AutoIt function from a specified .au3 file, passing in parameters and capturing the output. Returns an object containing:
 *   - result: The parsed result of the function call (if any)
 *   - output: The full console output from the AutoIt script execution
 *   - time: The time taken to execute the function, in seconds
 * 
 * Use runAutoItFunction() if you only want the result of the function call.
 * 
 * How this function works:
 * 
 * 1. Creates a temporary .au3 file based on current timestamp that:
 *    - Includes the specified file (should it support multiple? maybe not needed)
 *    - Calls the specified function, if given, with any given parameters
 *    - If passing arrays or maps as parameters, these will need a conversion function. 
 *      Perhaps as JSON? Could be included in temp script too.
 *    - Converts the result of the function to JSON
 *    - Outputs the JSON after a special flag
 * 
 * 2. Executes `autoit3 tempScript.au3`
 * 
 * 3. Captures full output, separating the console output from the function output
 * 
 * TODO:
 *   - String params need AutoIt escaping, not JSON escaping. Maybe use _JSON_Parse. Test with quotes, line returns and other special chars used in 8XP.
 *   - Support for passing arrays and objects (maps) as parameters
 *     (wrap them in _JSON_Parse)
 *   - Vitest
 *   - Maybe allow multiple function calls? To avoid needing to run the executable multiple times.
 *   - What command puts errors out into console rather than a MsgBox?
 *   - Include a copy of autoit.exe? And option to configure path
 *   - README, license, repo, publish
 *   - Support for no function call, include only (= no return value)
 *   - Support for executing custom Au3 code, not just a function call (still wraps it in a function to allow a return statement)
 *   - Also return @error value
 * 
 * @param {string} file - The path to the .au3 file containing the function to call, relative to the current working directory
 * @param {string} functionName - The name of the function to call within the .au3 file
 * @param {...any} params - The parameters to pass to the function, which will be JSON-stringified if they are objects or arrays
 * @returns {object} An object containing the full console output and the parsed result of the function call
*/
export function runAutoItCode(au3Code) {

   // Create a temporary .au3 file to execute the function call
   // Use a timestamp to ensure unique file names and avoid collisions
   // (milliseconds are included to reduce the chance of collisions)
   const tempFilePath = join(tmpdir(), `tempScript_${Date.now()}.au3`);

   const tempFileContent = `
      #NoTrayIcon
      Opt("TrayIconHide", 1) ; Hide the AutoIt tray icon for cleaner execution
      ${au3Code}
   `;

   // Write the temporary .au3 file
   writeFileSync(tempFilePath, tempFileContent);

   let result = { output: '' };
   let startTime = performance.now();

   try {
      // Execute the temporary .au3 file and capture the output
      result.output = execSync(`"c:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe" /ErrorStdOut "${tempFilePath}"`, { 
            encoding: 'utf-8',
            timeout: 4000 // 4 seconds timeout to prevent hanging
      });

   } catch (error) {
      // We could reach here under two scenarios:
      // 1. The AutoIt script executed but returned a non-zero exit code (e.g., due to an error in the script)
      // 2. The AutoIt script did not execute at all (e.g., AutoIt not found, script file not found, permission issues)
      // In both cases, we want to throw an error that contains the details.
      throw new Error(`Error executing AutoIt script: ${error.message}. Output: \n${error.stdout || error.stderr}`, {cause: error});

   } finally {
      // Clean up the temporary file, regardless of whether the execution was successful or not
      unlinkSync(tempFilePath);
   }

   result.time = Math.round(performance.now() - startTime) / 1000; // Time in seconds

   return result;
}

/**
 * Shortcut method to run an AutoIt function and return only the result
 * 
 * @param {*} file - The path to the .au3 file containing the function to call, relative to the current working directory
 * @param {*} functionName - The name of the function to call within the .au3 file
 * @param  {...any} params - Optional parameters to pass to the AutoIt function
 * @returns The result of the AutoIt function, which could be a string, number, array, or object, depending on what the function returns. If the function does not return anything, this will be undefined.
*/
export function runAutoItFunction(file, functionName, ...params) {
   const result = runAutoItFunctionDetailed(file, functionName, ...params);
   return result.result;
}

export function runAutoItFunctionDetailed(file, functionName, ...params) {
   
   // Create the content of the temporary .au3 file
   // Always relative to this bridge.js file, not the target .au3 file
   const pathToJsonLib = join(import.meta.dirname, 'au3-utilities/json.au3');  

   // Relative to the current working directory
   const pathToTargetFile = join(process.cwd(), file);  

   // Generate the list of parameters for the function call, wrapping them in 
   // _JSON_Parse to support arrays, objects, line returns, and special characters
   const functionParams = params.map(p => 
      '_JSON_Parse("' + JSON.stringify(p).replaceAll('"', '""') + '")'
   ).join(', ');

   // Full function call string, e.g. MyFunction(_JSON_Parse("param1"), _JSON_Parse("param2"))
   const functionCall = `${functionName}(${functionParams})`;

   // Generate the AutoIt code to be executed
   let au3Code = `
      #include "${pathToJsonLib}"
      #include "${pathToTargetFile}"
      Local $result = ${functionCall}
      ConsoleWrite("FUNCTION_OUTPUT_START" & _JSON_Generate($result) & "FUNCTION_OUTPUT_END")
   `;

   // For debugging, you can log the temp file content
   // console.log('Generated AutoIt script content:\n', au3Code);

   let result = runAutoItCode(au3Code);

   // Extract the function output from the rest of the console output
   const match = result.output.match(/FUNCTION_OUTPUT_START(.*?)FUNCTION_OUTPUT_END/s);

   if (!match)
      throw new Error('Function output not found in console output');

   const functionOutput = JSON.parse(match[1]);
   result.output = result.output.split('FUNCTION_OUTPUT_START')[0];   // everything up until the function output
   result.result = functionOutput;
   return result;
}

// Perform a test run
// console.log(import.meta.resolve('./au3/json.au3'));
// console.log(__dirname);

// const result = runAutoItFunctionCaptureOutput('./tests/sample1.au3', 'Sample', 'Hello, World!', 42, 3.14);
// console.log('Function result:', result);
// console.log('Function result:', result.result);
