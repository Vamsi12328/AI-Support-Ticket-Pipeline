
import { GoogleGenAI, Type } from "@google/genai";
import { EnrichedTicket } from '../types';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // ✅ This loads your GEMINI_API_KEY


// ✅ Check the correct variable name
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}

// ✅ Use the correct key name
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief, one-sentence summary of the issue." },
        priority: {
            type: Type.OBJECT,
            description: "Priority assessment with justification.",
            properties: {
                level: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'], description: "The calculated priority level."},
                reason: { type: Type.STRING, description: "Concise justification for the priority level based on keywords." }
            },
            required: ["level", "reason"]
        },
        routing: {
            type: Type.OBJECT,
            description: "Suggested routing for the ticket.",
            properties: {
                team: { type: Type.STRING, description: "The suggested team, e.g., Frontend-Devs, Backend-API." },
                assignee: { type: Type.STRING, description: "A hypothetical assignee name with a reason for the suggestion." }
            },
            required: ["team", "assignee"]
        },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of relevant technical and descriptive tags."
        },
        rootCause: { type: Type.STRING, description: "A plausible, specific technical root cause analysis." },
        codeCorrection: {
            type: Type.OBJECT,
            description: "Specific code fix suggestion.",
            properties: {
                file: { type: Type.STRING, description: "The likely filename to be modified." },
                explanation: { type: Type.STRING, description: "An explanation of the suggested code change." },
                currentCode: { type: Type.STRING, description: "A snippet of the current problematic code." },
                suggestedFix: { type: Type.STRING, description: "A snippet of the corrected code." }
            },
            required: ["file", "explanation", "currentCode", "suggestedFix"]
        },
        similarTickets: {
            type: Type.ARRAY,
            description: "A list of plausible, fictional but relevant previously resolved tickets.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Fictional ticket ID, e.g., TICKET-8432." },
                    description: { type: Type.STRING, description: "Brief description of the similar resolved issue." }
                },
                required: ["id", "description"]
            }
        }
    },
    required: ["summary", "priority", "routing", "tags", "rootCause", "codeCorrection", "similarTickets"]
};

export const analyzeTicket = async (ticketText: string): Promise<EnrichedTicket> => {
    const prompt = `You are "IntelliTriage", an expert AI assistant for software development and support teams. Your task is to analyze raw, unstructured user-submitted tickets and enrich them into a structured, actionable format.

Given the following user ticket, analyze it and return a JSON object that strictly adheres to the provided schema.

User Ticket:
---
${ticketText}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        return parsedJson as EnrichedTicket;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the ticket.");
    }
};
