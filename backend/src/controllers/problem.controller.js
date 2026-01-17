import { db } from "../libs/db.js";
import {
    getJudge0LanguageId,
    pollBatchResults,
    submitBatch,
} from "../libs/judge0.lib.js";



export const createProblem = async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testscases,
        codeSnippets,
        referenceSolution,
    } = req.body;

    try {
        for (const [language, solutionCode] of Object.entries(referenceSolution)) {
            const languageId = getJudge0LanguageId(language);



            if (!languageId) {
                return res.status(400).json({ error: `Language ${language} is not supported` });
            }

            const submissions = testscases.map(({ input, output }) => ({
                source_code: Buffer.from(solutionCode).toString('base64'),
                language_id: languageId,
                stdin: Buffer.from(input).toString('base64'),
                expected_output: Buffer.from(output).toString('base64'),
            }));

            const submissionResults = await submitBatch(submissions);
            const tokens = submissionResults.map((res) => res.token);
            const results = await pollBatchResults(tokens);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                console.log("Result:", result);

                if (result.status.id !== 3) {
                    return res.status(400).json({
                        error: `Testcase ${i + 1} failed for language ${language}`,
                    });
                }
            }
        }

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

        return res.status(201).json({
            success: true,
            message: "Problem created successfully",
            problem: newProblem
        });

    } catch (error) {
        console.error("Error creating problem:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getAllProblems = async (req, res) => {

    try {
        const problems = await db.problem.findMany({
            include: {
                solvedBy: {
                    where: {
                        userId: req.user.id
                    }
                }
            }
        });
        
        if (!problems) {
            return res.status(404).json({ error: "No problems found" });
        }

        res.status(200).json({
            success: true,
            message: "Problems fetched successfully",
            problems: problems
        })

    } catch (error) {

        console.error("Error fetching problems:", error);
        res.status(500).json({ error: "fetching problems Internal server error" });
    }

}

export const getProblemById = async (req, res) => {

    const { id } = req.params;

    try {

        const problem = await db.problem.findUnique({
            where: { id: id }
        });

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        res.status(200).json({
            success: true,
            message: "Problem fetched successfully",
            problem: problem
        });

    } catch (error) {
        console.error("Error fetching problem by ID:", error);
        res.status(500).json({ error: "fetching problem by ID Internal server error" });
    }

}

export const updateProblem = async (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testscases,
        codeSnippets,
        referenceSolution,
    } = req.body;

    try {
        // 1. Check if problem exists
        const existingProblem = await db.problem.findUnique({
            where: { id: id }
        });

        if (!existingProblem) {
            return res.status(404).json({
                error: "Problem not found"
            });
        }

        // 2. Check if user is the owner (optional but recommended)
        if (existingProblem.userId !== req.user.id) {
            return res.status(403).json({
                error: "You are not authorized to update this problem"
            });
        }

        // 3. Validate reference solutions if provided
        if (referenceSolution) {
            for (const [language, solutionCode] of Object.entries(referenceSolution)) {
                const languageId = getJudge0LanguageId(language);

                if (!languageId) {
                    return res.status(400).json({
                        error: `Language ${language} is not supported`
                    });
                }

                const submissions = testscases.map(({ input, output }) => ({
                    source_code: solutionCode,
                    language_id: languageId,
                    stdin: input,
                    expected_output: output,
                }));

                const submissionResults = await submitBatch(submissions);
                const tokens = submissionResults.map((res) => res.token);
                const results = await pollBatchResults(tokens);

                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    console.log("Result:", result);

                    if (result.status.id !== 3) {
                        return res.status(400).json({
                            error: `Testcase ${i + 1} failed for language ${language}`,
                            status: result.status.description
                        });
                    }
                }
            }
        }

        // 4. Update problem
        const updatedProblem = await db.problem.update({
            where: { id: id },
            data: {
                ...(title && { title: title }),
                ...(description && { description: description }),
                ...(difficulty && { difficulty: difficulty }),
                ...(tags && { tags: tags }),
                ...(examples && { examples: examples }),
                ...(constraints && { constraints: constraints }),
                ...(testscases && { testscases: testscases }),
                ...(codeSnippets && { codeSnippets: codeSnippets }),
                ...(referenceSolution && { referenceSolution: referenceSolution }),
            }
        });

        res.status(200).json({
            success: true,
            message: "Problem updated successfully",
            problem: updatedProblem
        });

    } catch (error) {
        console.error("Error updating problem:", error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: "Problem not found"
            });
        }

        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}

export const deleteProblem = async (req, res) => {

    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({
            where: { id: id }
        });

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        await db.problem.delete({
            where: { id: id }
        });

        res.status(200).json({
            success: true,
            message: "Problem deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting problem:", error);
        res.status(500).json({ error: "deleting problem Internal server error" });
    }

}

export const getSolvedProblemsByUser = async (req, res) => {

     try {
    const problems = await db.problem.findMany({
      where:{
        solvedBy:{
          some:{
            userId:req.user.id
          }
        }
      },
      include:{
        solvedBy:{
          where:{
            userId:req.user.id
          }
        }
      }
    })

    res.status(200).json({
      success:true,
      message:"Problems fetched successfully",
      problems
    })
  } catch (error) {
    console.error("Error fetching problems :" , error);
    res.status(500).json({error:"Failed to fetch problems"})
  }


}
