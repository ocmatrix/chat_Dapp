import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey });

export const generateSmartReply = async (
  conversationHistory: string[],
  lastMessage: string
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const prompt = `
      You are a helpful AI assistant inside a decentralized chat app.
      Context: The user is chatting with a peer.
      History: ${conversationHistory.slice(-5).join('\n')}
      Last received message: "${lastMessage}"
      
      Task: Suggest a short, polite, and relevant reply (under 20 words) that the user might want to send. 
      Just output the reply text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const chatWithGemini = async (message: string): Promise<string> => {
  if (!apiKey) return "Please configure the API_KEY to use the AI assistant.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: "You are a crypto-savvy assistant in a Web3 DApp. Be concise, helpful, and friendly."
      }
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Error contacting Gemini AI.";
  }
};