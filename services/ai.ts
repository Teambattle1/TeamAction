
import { GoogleGenAI, Type } from "@google/genai";
import { TaskTemplate, IconId, TaskType } from "../types";

// Schema to ensure Gemini returns data compatible with our App
const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Short catchy title for the task" },
      question: { type: Type.STRING, description: "The actual question or challenge text" },
      type: { 
        type: Type.STRING, 
        enum: ["text", "multiple_choice", "boolean", "slider", "checkbox", "dropdown"],
        description: "The type of input required"
      },
      answer: { type: Type.STRING, description: "The correct answer (for text/boolean/dropdown)", nullable: true },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Options for multiple_choice, checkbox, dropdown",
        nullable: true
      },
      correctAnswers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of correct answers if type is checkbox",
        nullable: true
      },
      numericRange: {
        type: Type.OBJECT,
        properties: {
          min: { type: Type.NUMBER },
          max: { type: Type.NUMBER },
          correctValue: { type: Type.NUMBER }
        },
        description: "Only for slider type",
        nullable: true
      },
      iconId: { 
        type: Type.STRING, 
        enum: ['default', 'star', 'flag', 'trophy', 'camera', 'question', 'skull', 'treasure'],
        description: "The visual icon for the map"
      },
      hint: { type: Type.STRING, description: "A helpful hint for the player", nullable: true }
    },
    required: ["title", "question", "type", "iconId"]
  }
};

// Schema for single task generation from image
const singleTaskSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Short catchy title for the task" },
    question: { type: Type.STRING, description: "The actual question or challenge text based on the image" },
    type: { 
      type: Type.STRING, 
      enum: ["text", "multiple_choice", "boolean", "slider", "checkbox", "dropdown"],
      description: "The type of input required"
    },
    answer: { type: Type.STRING, description: "The correct answer (for text/boolean/dropdown)", nullable: true },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Options for multiple_choice, checkbox, dropdown",
      nullable: true
    },
    correctAnswers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of correct answers if type is checkbox",
      nullable: true
    },
    numericRange: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER },
        correctValue: { type: Type.NUMBER }
      },
      description: "Only for slider type",
      nullable: true
    },
    iconId: { 
      type: Type.STRING, 
      enum: ['default', 'star', 'flag', 'trophy', 'camera', 'question', 'skull', 'treasure'],
      description: "The visual icon for the map"
    },
    hint: { type: Type.STRING, description: "A helpful hint for the player", nullable: true },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags describing the content" }
  },
  required: ["title", "question", "type", "iconId"]
};

export const generateAiTasks = async (topic: string, count: number = 5, language: string = 'English', additionalTag?: string): Promise<TaskTemplate[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Create a timeout promise (90 seconds for larger batch generation)
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error("Request timed out. The AI model is taking too long to respond."));
    }, 90000);
  });

  try {
    const apiCallPromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create exactly ${count} diverse and fun scavenger hunt/quiz tasks for a location-based game.
      Topic: "${topic}"
      Language: ${language}
      
      Ensure a mix of task types (multiple_choice, text, boolean, slider, checkbox).
      For 'slider', provide min, max, and correctValue.
      For 'checkbox', provide multiple correct options in correctAnswers.
      The 'iconId' should be relevant to the specific question's content.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for maximum speed and lower latency
        systemInstruction: "You are a professional game designer for 'TeamAction', a location-based GPS adventure. You specialize in creating concise, engaging, and localized tasks.",
      },
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    const rawData = JSON.parse(response.text || "[]");

    return rawData.map((item: any, index: number) => {
      const tags = ['ai-generated', ...topic.split(' ').map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''))];
      if (additionalTag) tags.push(additionalTag);

      return {
        id: `ai-${Date.now()}-${index}`,
        title: item.title,
        iconId: (item.iconId as IconId) || 'default',
        tags: tags.filter(t => t.length > 1),
        createdAt: Date.now(),
        points: 100,
        task: {
          type: (item.type as TaskType) || 'text',
          question: item.question,
          answer: item.answer,
          options: item.options,
          correctAnswers: item.correctAnswers,
          range: item.numericRange ? {
            min: item.numericRange.min,
            max: item.numericRange.max,
            step: 1,
            correctValue: item.numericRange.correctValue,
            tolerance: 0
          } : undefined
        },
        feedback: {
          correctMessage: 'Correct!',
          showCorrectMessage: true,
          incorrectMessage: 'Not quite. Try again!',
          showIncorrectMessage: true,
          hint: item.hint || 'Look closely!',
          hintCost: 10
        },
        settings: {
          scoreDependsOnSpeed: false,
          language: language,
          showAnswerStatus: true,
          showCorrectAnswerOnMiss: false
        }
      };
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generateTaskFromImage = async (base64Image: string): Promise<TaskTemplate | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;
    
    const mimeType = matches[1];
    const data = matches[2];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: "Create an engaging scavenger hunt task based on this image. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: singleTaskSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const item = JSON.parse(response.text || "{}");
    if (!item.title) return null;

    return {
        id: `ai-img-${Date.now()}`,
        title: item.title,
        iconId: (item.iconId as IconId) || 'camera',
        tags: ['image-generated', ...(item.tags || [])],
        createdAt: Date.now(),
        points: 100,
        task: {
          type: (item.type as TaskType) || 'text',
          question: item.question,
          answer: item.answer,
          options: item.options,
          correctAnswers: item.correctAnswers,
          imageUrl: base64Image,
          range: item.numericRange ? {
            min: item.numericRange.min,
            max: item.numericRange.max,
            step: 1,
            correctValue: item.numericRange.correctValue,
            tolerance: 0
          } : undefined
        },
        feedback: {
          correctMessage: 'Correct!',
          showCorrectMessage: true,
          incorrectMessage: 'Incorrect, try again.',
          showIncorrectMessage: true,
          hint: item.hint || 'Check the details!',
          hintCost: 10
        },
        settings: {
          scoreDependsOnSpeed: false,
          language: 'English',
          showAnswerStatus: true,
          showCorrectAnswerOnMiss: false
        }
    };
  } catch (error) {
    console.error("AI Image Task Generation Error:", error);
    return null;
  }
};

export const generateAiImage = async (prompt: string, style: string = 'cartoon'): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: `A simple, flat, vector illustration for a game task: ${prompt}. Style: ${style}. Minimal background, high contrast.`,
        });
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image Generation Error", e);
        return null;
    }
};

export const findCompanyDomain = async (query: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Return ONLY the official website domain for: "${query}" (e.g. google.com). If not a company or not found, return "null".`,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        const text = response.text?.trim() || "";
        return text !== "null" && text.includes('.') ? text : null;
    } catch (e) {
        return null;
    }
};
