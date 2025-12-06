import { db } from "../libs/db.js";
import { submitBatch } from "../libs/judge0.lib.js";
import { pollBatchResults } from "../libs/judge0.lib.js";
import { getLanguageName } from "../libs/judge0.lib.js";

export const executeCode = async (req, res) => {

   try {

      const { source_Code, language_id, stdin, expected_Output, problemId } = req.body;

      const userId = req.user.id;

      if (!Array.isArray(stdin) ||
         stdin.length === 0 ||
         !Array.isArray(expected_Output) ||
         expected_Output.length !== stdin.length
      ) {
         return res.status(400).json({ error: "Invalid input or expected output" });
      }

      const submissions = stdin.map((input) => ({
         source_code: Buffer.from(source_Code).toString('base64'),
         language_id: language_id,
         stdin: Buffer.from(input).toString('base64'),

      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      console.log("Final Results:", results);


      let allPassed = true;
      const detailedResults = results.map((result, index) => {



         const stdoutt = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8').trim() : "";
         const expected_outputt = expected_Output[index].trim();

         // Format function
         const format = (str) => {
            if (str.toLowerCase() === "true") return true;
            if (str.toLowerCase() === "false") return false;
            if (!isNaN(str) && !isNaN(parseFloat(str)) && str !== "") return Number(str);
            return str;
         };

         const stdout = format(stdoutt);
         const expected_output = format(expected_outputt);

         const passed = stdout === expected_output;

         //    console.log(`Test Case ${index + 1}:`, {
         //       stdin: stdin[index],
         //       expected_output: format(expected_output),
         //       stdout: format(stdout),
         //       passed,
         //    });

         if (!passed) {
            allPassed = false;
         }

         return {
            testCase: index + 1,
            passed,
            stdout,
            expected: expected_output,
            stderr: result.stderr || null,
            compile_output: result.compile_output || null,
            status: result.status.description,
            memory: result.memory ? `${result.memory} KB` : undefined,
            time: result.time ? `${result.time} s` : undefined,
         };


      });


      // console.log("detailedResults:", detailedResults);

       const submission = await db.submission.create({
      data: {
        userId,
        problemId,
        sourceCode: {code: source_Code},
        language: getLanguageName(language_id),
        stdin: JSON.stringify(stdin),
        stdout: JSON.stringify(detailedResults.map((r) => r.stdout)),
        stderr: detailedResults.some((r) => r.stderr)
          ? JSON.stringify(detailedResults.map((r) => r.stderr))
          : null,
        compileOutput: detailedResults.some((r) => r.compile_output)
          ? JSON.stringify(detailedResults.map((r) => r.compile_output))
          : null,
        status: allPassed ? "Accepted" : "Wrong Answer",
        memory: detailedResults.some((r) => r.memory)
          ? JSON.stringify(detailedResults.map((r) => r.memory))
          : null,
        time: detailedResults.some((r) => r.time)
          ? JSON.stringify(detailedResults.map((r) => r.time))
          : null,
      },
    });

   //  console.log("Submission saved:", submission);


       // If All passed = true mark problem as solved for the current user
    if (allPassed) {
      await db.problemSolved.upsert({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        update: {},
        create: {
          userId,
          problemId,
        },
      });
    } 

      // 8. Save individual test case results  using detailedResult

   const testCaseResults = detailedResults.map((result) => ({
  submissionId: submission.id,
  testCase: result.testCase,
  passed: result.passed,
  stdout: result.stdout != null ? String(result.stdout) : null,
  expected: result.expected != null ? String(result.expected) : null,
  stderr: result.stderr || null,
  compileOutput: result.compile_output || null,
  status: result.status,
  memory: result.memory,
  time: result.time,
}));

await db.testCaseResult.createMany({
  data: testCaseResults,
});

   const submissionWithTestCase = await db.submission.findUnique({
      where: {
        id: submission.id,
      },
      include: {
        testCases: true,
      },
    });
    //
    res.status(200).json({
      success: true,
      message: "Code Executed! Successfully!",
      submission: submissionWithTestCase,
    });


   } catch (error)  {
    console.error("Error executing code:", error.message);
    res.status(500).json({ error: "Failed to execute code" });
  }

}


