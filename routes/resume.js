import express from "express";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Applicant from "../models/Applicant.js";
import authenticateJwt from "../middleware/authUser.js";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function extractTextFromPdf(pdfurl) {
    try {
        const loadingTask = pdfjsLib.getDocument(pdfurl);
        const pdf = await loadingTask.promise;

        let textContent = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContentData = await page.getTextContent();

            const pageText = textContentData.items.map(item => item.str).join(" ");
            textContent += pageText + "\n";
        }

        return textContent;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        return null;
    }
}

router.post("/url", authenticateJwt,async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "Please enter a valid URL" });
    }

    const extractedText = await extractTextFromPdf(url);
    if (!extractedText) {
        return res.status(500).json({ error: "Failed to extract text from PDF" });
    }
    const prompt = `
You are an AI assistant extracting structured data from a resume. Analyze the following resume format and generate JSON in this format:

{
  "name": "Full Name",
  "email": "Email Address",
  "education": {
    "degree": "Degree Name",
    "branch": "Branch of Study",
    "institution": "University/College Name",
    "year": "Year of Completion"
  },
  "experience": {
    "job_title": "Job Title",
    "company": "Company Name",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD or Present"
  },
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "summary": "A short summary about the candidate profile."
}

Resume Text:
---
${extractedText}
---
Extract and return the JSON only in json format, without any extra text.
`;

    const result = await model.generateContent(prompt);
    const responseTxt = await result.response.text();

    try {

        let cleanJson = responseTxt.replace(/```json|```/g, "").trim();


        try {
            const jsonResponse = JSON.parse(cleanJson);
            console.log("Valid JSON Parsed Successfully:", jsonResponse);
            const applicant = Applicant.create(jsonResponse);
            return res.json(jsonResponse);
        } catch (err) {
            console.warn("JSON Parse Failed. Trying to Fix...");


            cleanJson = cleanJson
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]")
                .replace(/(?<![:,\[{])\s*"/g, ',"')
                .replace(/^,\s*/, "");


            const fixedJson = JSON.parse(cleanJson);
            console.log("Fixed JSON:");
            return res.json(fixedJson);
        }
    } catch (error) {
        console.error("Final JSON Parsing Failed:", error);
        res.status(500).json({ error: "Failed to parse JSON", text: responseTxt });
    }


});


router.post("/search",authenticateJwt ,async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const regex = new RegExp(name, "i");
        const applicants = await Applicant.find({ name: { $regex: regex } });
        if (applicants.length === 0) {
            return res.status(404).json({ error: "No matching applicants found" });
        }
        res.status(200).json({ data: applicants });
    }
    catch (err) {
        console.error("Error searching applicants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

export default router;
