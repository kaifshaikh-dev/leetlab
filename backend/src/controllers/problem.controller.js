import { db } from "../libs/db.js";
import { getJudge0LanguageId, submitBatch, pollBatchResults } from "../libs/judge0.lib.js";

export const createProblem = async (req, res) => {

    // going to get all the data from the req body
    const { title, description, difficulty, tags, examples, constraints, codeSnippets, referenceSolution, testscases } = req.body;

    // going to check user role once again

    if (req.user.role !== 'ADMIN') {

        return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    try {

        for (const [language, solutionCode] of Object.entries(referenceSolution)) {

            const languageId = getJudge0LanguageId(language);

            if (!languageId) {
                return res.status(400).json({ error: `Unsupported language: ${language}` });
            }

            const submissions = testscases.map(({ input, output }) => ({
                language_id: languageId,
                source_code: solutionCode,
                stdin: input,
                expected_output: output

            }))

            const submissionResults = await submitBatch(submissions);

            const tokens = submissionResults.map((res) => res.token)

            const results = await pollBatchResults(tokens);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                if (result.status.id !== 3) {
                    return res.status(400).json({ error: `Reference solution failed for language: ${language} on testcase ${i + 1}` });
                }

                // save problem to db
                const newProblem = await db.problem.create({
                    data: {
                        title, 
                        description, 
                        difficulty, 
                        tags, 
                        examples, 
                        constraints, 
                        codeSnippets,
                        referenceSolution, 
                        testscases, 
                        userId: req.user.id

                    },



                })

                return res.status(201).json(newProblem);
            }


        }

    } catch (error) {

    }




}

export const getAllProblems = async (req, res) => {

}

export const getProblemById = async (req, res) => {

}
export const updateProblem = async (req, res) => {

}
export const deleteProblem = async (req, res) => {

}
export const getSolvedProblemsByUser = async (req, res) => {

}
