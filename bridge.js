import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * The main function in this file does these things:
 * 
 * 1. Creates a temporary .au3 file based on current timestamp that
 *    - Imports the specified file (should it support multiple? maybe not needed)
 *    - Calls the provided function, if given
 *    - Includes the given parameters
 *    - If passing arrays or maps as parameters, these will need a conversion function. 
 *      Perhaps as JSON? Could be included in temp script too.
 *    - Converts the result of the function to JSON
 *    - Outputs the JSON after a special flag
 * 
 * 2. Executes autoit3 tempScript.au3
 * 
 * 3. Captures full output, separating the console output from the function output
 * 
 * TODO:
 *   - Support for passing arrays and objects (maps) as parameters
 *     (wrap them in _JSON_Parse)
 * 
 * @param {string} file - The path to the .au3 file containing the function to call, relative to the current working directory
 * @param {string} functionName - The name of the function to call within the .au3 file
 * @param {...any} params - The parameters to pass to the function, which will be JSON-stringified if they are objects or arrays
 * @returns {object} An object containing the full console output and the parsed result of the function call
*/
export function runAutoItFunctionCaptureOutput(file, functionName, ...params) {

   const tempFilePath = join(tmpdir(), `tempScript_${Date.now()}.au3`);

   // Create the content of the temporary .au3 file
   const pathToJsonLib = join(import.meta.dirname, 'au3/json.au3');  // Always relative to this bridge.js file, not the target .au3 file
   const pathToTargetFile = join(process.cwd(), file);  // Relative to the current working directory
   const functionCall = `${functionName}(${params.map(p => JSON.stringify(p)).join(', ')})`;
   const tempFileContent = `
Opt("TrayIconHide", 1) ; Hide the AutoIt tray icon for cleaner execution
#include "${pathToJsonLib}"
#include "${pathToTargetFile}"
Local $result = ${functionCall}
ConsoleWrite("FUNCTION_OUTPUT_START" & _JSON_Generate($result) & "FUNCTION_OUTPUT_END")
`;

   // For debugging, you can log the temp file content
   // console.log('Generated AutoIt script content:\n', tempFileContent);

   // Write the temporary .au3 file
   writeFileSync(tempFilePath, tempFileContent);

   let result;
   let startTime = performance.now();

   try {
      // Execute the temporary .au3 file and capture the output
      const output = execSync(`"c:\\Program Files (x86)\\AutoIt3\\AutoIt3.exe" "${tempFilePath}"`, { 
         encoding: 'utf-8',
         timeout: 4000 // 4 seconds timeout to prevent hanging
      });
      // Extract the function output from the console output
      const match = output.match(/FUNCTION_OUTPUT_START(.*?)FUNCTION_OUTPUT_END/s);
      if (match) {
         const functionOutput = JSON.parse(match[1]);
         result = { 
            output: output.split('FUNCTION_OUTPUT_START')[0],   // everything up until the function output
            result: functionOutput 
         };
      } else {
         throw new Error('Function output not found in console output');
      }
   } catch (error) {
      console.error('Error executing AutoIt script:', error);
      result = { output: '', result: null };
   } finally {
      // Clean up the temporary file
      unlinkSync(tempFilePath);
   }

   result.time = Math.round(performance.now() - startTime) / 1000; // Time in seconds

   return result;
}

export function runAutoItFunction(file, functionName, ...params) {
   return runAutoItFunctionCaptureOutput(...arguments).result;
}


// Perform a test run
// console.log(import.meta.resolve('./au3/json.au3'));
// console.log(__dirname);

const result = runAutoItFunctionCaptureOutput('./tests/sample1.au3', 'Sample', 'Hello, World!', 42, 3.14);
console.log('Function result:', result);
console.log('Function result:', result.result);
