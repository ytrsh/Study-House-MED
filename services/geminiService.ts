
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiParsedTask } from "../types.ts";

export const parseCurriculumPdf = async (base64Data: string): Promise<GeminiParsedTask[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use the recommended { parts: [...] } structure for multiple input parts
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        {
          text: "Extract all classes or course names from the tables in this curriculum PDF. For each class, provide the course title and if possible, its category (e.g., Core, Elective, Humanities). Return as a structured JSON list.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            className: {
              type: Type.STRING,
              description: "The name of the class or course",
            },
            category: {
              type: Type.STRING,
              description: "The category or department of the class",
            },
          },
          required: ["className"],
        },
      },
    },
  });

  try {
    const jsonStr = response.text;
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as GeminiParsedTask[];
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
};
