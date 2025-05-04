// lib/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';

// Use GEMINI_API_KEY from env
const apiKey = process.env.GEMINI_API_KEY;
const embeddingModelName = process.env.EMBEDDING_MODEL_NAME || 'text-embedding-004';
const geminiModelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-latest';

if (!apiKey) {
  throw new Error('Missing Google Gemini API Key (GEMINI_API_KEY) in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const embeddingModel = genAI.getGenerativeModel({ model: embeddingModelName });
export const generativeModel = genAI.getGenerativeModel({ model: geminiModelName });

// --- Generate Embedding Function ---
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!text) {
      console.warn("generateEmbedding called with empty text.");
      return null;
  }
  try {
    // Clean text slightly
    const cleanedText = text.replace(/\n/g, ' ').trim();
    if (!cleanedText) {
        console.warn("generateEmbedding called with effectively empty text after cleaning.");
        return null;
    }

    console.log(`Generating embedding for text starting with: "${cleanedText.substring(0, 70)}..."`);
    const result = await embeddingModel.embedContent(cleanedText);
    const embedding = result.embedding;

    if (!embedding?.values || embedding.values.length === 0) {
        console.error("Embedding generation failed, no values returned or empty array.");
        return null;
    }
    console.log(` -> Embedding generated, dimensions: ${embedding.values.length}`);
    return embedding.values;

  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

// --- Call Gemini for Understanding, Advice, Keywords ---
export interface GeminiResponse {
    ai_understanding: string;
    advice: string;
    search_keywords: string;
}

export const callGeminiForUnderstanding = async (query: string, history: Content[]): Promise<GeminiResponse | null> => {
    const systemInstruction = `You are Bella, Planet Beauty's expert AI shopping assistant.
    Your tasks based on the LATEST user query ("${query}"):
    1.  Understand the user's core need or question.
    2.  Extract the key terms or intent suitable for a product search (e.g., "pore tightening", "acne", "hydrating serum").
    3.  Generate a concise "ai_understanding" text summarizing the user's request.
    4.  Generate helpful "advice" text related to the request (e.g., usage tips, general recommendations). If the user asks for a routine, provide it in the advice using simple HTML lists (ul, li) if appropriate.
    5.  Return ONLY a valid JSON object string with the keys "ai_understanding", "advice", and "search_keywords" (a string of keywords for vector search).

    Example Input Query: "I need product that can fix my acne pores, a set or combo of products with how to use pore tightening set"
    Example Output JSON String:
    {
      "ai_understanding": "User is looking for a Pore Tightening Set to fix acne pores and needs usage instructions.",
      "advice": "For pore tightening sets, cleanse your face first, then apply the toner/serum focusing on affected areas, usually morning and night. Follow with a suitable moisturizer. Consistency is key!",
      "search_keywords": "Pore Tightening Set acne pores fix usage instructions"
    }

    Example Input Query: "What's a good hydrating serum?"
    Example Output JSON String:
    {
        "ai_understanding": "User is asking for recommendations for a hydrating serum.",
        "advice": "Hydrating serums often contain ingredients like Hyaluronic Acid or Glycerin. Apply a few drops to damp skin after cleansing and before moisturizing for best absorption. Look for one suitable for your skin type!",
        "search_keywords": "good hydrating serum recommendations"
    }`;

    try {
        console.log(`Calling Gemini for query: "${query}" with ${history.length} history turns.`);
        const result = await generativeModel.generateContent({
            contents: [...history, { role: 'user', parts: [{ text: query }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.5,
                maxOutputTokens: 500, // Adjust as needed
            },
             safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
            ]
        });

        const response = result.response;
        // Add basic check for response existence
        if (!response) {
            console.error("Gemini response object is missing.");
            // Try to get finish reason if available in the result structure
            const finishReason = result?.response?.candidates?.[0]?.finishReason;
            const safetyRatings = result?.response?.candidates?.[0]?.safetyRatings;
            console.error(`Gemini Finish Reason: ${finishReason || 'Unknown'}`);
            if (safetyRatings) console.error(`Gemini Safety Ratings: ${JSON.stringify(safetyRatings)}`);
            throw new Error(`Gemini did not return a response. Finish Reason: ${finishReason || 'Unknown'}`);
        }

        const responseText = response.text();
        console.log("Raw Gemini Response Text:", responseText);

        // Attempt to parse the JSON directly from the response
        const parsedJson = JSON.parse(responseText);

        // Basic validation
        if (parsedJson && typeof parsedJson.ai_understanding === 'string' && typeof parsedJson.advice === 'string' && typeof parsedJson.search_keywords === 'string') {
             console.log("Successfully parsed Gemini response.");
             return parsedJson as GeminiResponse;
        } else {
            console.error("Gemini response JSON structure is invalid after parsing:", parsedJson);
            throw new Error("Invalid JSON structure from AI.");
        }

    } catch (error) {
        console.error('Error calling/processing Gemini for understanding:', error);
        return null; // Return null on error
    }
};