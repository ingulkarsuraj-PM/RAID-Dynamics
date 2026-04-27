import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface ExtractedRAIDItem {
  type: "RISK" | "ACTION" | "ISSUE" | "DEPENDENCY";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  owner?: string;
  dueDate?: string;
}

export async function extractRAIDItems(text: string): Promise<ExtractedRAIDItem[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract RAID (Risks, Actions, Issues, Dependencies) items from the following text. 
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["RISK", "ACTION", "ISSUE", "DEPENDENCY"] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
              owner: { type: Type.STRING },
              dueDate: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
            },
            required: ["type", "title", "priority"],
          },
        },
      },
    });

    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("AI Extraction failed:", error);
    return [];
  }
}

export async function generateStakeholderReport(items: any[], stakeholders: any[]): Promise<string> {
  try {
    const prompt = `
      You are an AI Project Management Assistant named RAID Dynamics Agent. 
      Analyze the following RAID (Risk, Action, Issue, Dependency) log items and generate a concise, professional daily executive briefing for stakeholders.
      
      Log Items: ${JSON.stringify(items.map(i => ({ type: i.type, title: i.title, priority: i.priority, status: i.status, probability: i.probability, impact: i.impact })))}
      
      Follow PMI standards. The report should include:
      1. Overall Project Health (Green/Amber/Red)
      2. Top Critical Risks (based on Impact/Probability)
      3. Overdue or Urgent Actions
      4. Summary of newly identified items.
      
      Keep it professional and action-oriented. The stakeholders are: ${stakeholders.map(s => `${s.name} (${s.role})`).join(', ')}.
      
      Output in raw Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text || "Unable to generate AI report text.";
  } catch (error) {
    console.error("AI Report generation failed:", error);
    return "Unable to generate AI report at this time.";
  }
}

export async function queryRAIDLog(query: string, items: any[]): Promise<string> {
  try {
    const prompt = `
      You are Raksha, an intelligent AI Project Management Agent specializing in RAID (Risk, Action, Issue, Dependency) logs.
      You have access to the current project data below.
      
      Project Data: ${JSON.stringify(items.map(i => ({ 
        type: i.type, 
        title: i.title, 
        priority: i.priority, 
        status: i.status, 
        owner: i.owner,
        dueDate: i.dueDate,
        probability: i.probability,
        impact: i.impact,
        description: i.description
      })))}
      
      User Question: "${query}"
      
      Respond as Raksha. Be helpful, concise, and professional. 
      If the user asks for specific items, provide details. 
      If they ask for general status, give an overview.
      Always refer to project health based on the data.
      
      Output in raw Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text || "I'm sorry, I couldn't process that query.";
  } catch (error) {
    console.error("AI Query failed:", error);
    return "I'm having trouble accessing the RAID logs right now.";
  }
}
