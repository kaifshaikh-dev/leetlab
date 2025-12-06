
import dotenv from 'dotenv';


import axios from "axios"

dotenv.config();



export const getJudge0LanguageId = (language) => {
    const languageMap = {
        "PYTHON": 71,
        "JAVA": 62,
        "JAVASCRIPT": 63,
    }
    return languageMap[language.toUpperCase()]
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const pollBatchResults = async (tokens) => {
    while (true) {
        const { data } = await axios.get(
            `https://judge0-ce.p.rapidapi.com/submissions/batch`,
            {
                params: {
                    tokens: tokens.join(","),
                    base64_encoded: true,
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            }
        )

        const results = data.submissions;
        const isAllDone = results.every((r) => r.status.id !== 1 && r.status.id !== 2)

        if (isAllDone) return results
        await sleep(2000)
    }
}

export const submitBatch = async (submissions) => {
    const { data } = await axios.post(
        `https://judge0-ce.p.rapidapi.com/submissions/batch?base64_encoded=true`,
        { submissions: submissions }, 
        {
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        }
    )

    console.log("Submission Results:", data)
    return data
}

export function getLanguageName(languageId){
    const LANGUAGE_NAMES = {
        74: "TypeScript",
        63: "JavaScript",
        71: "Python",
        62: "Java",
    }

    return LANGUAGE_NAMES[languageId] || "Unknown"
}