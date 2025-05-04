// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { vectorIndex, UPSTASH_VECTOR_INDEX_NAME } from '@/lib/redis';
// Removed unused GeminiResponse import
import { generateEmbedding, callGeminiForUnderstanding } from '@/lib/gemini';
import { Content } from '@google/generative-ai';
import { QueryResult } from '@upstash/vector';

// Metadata structure expected from vector search results
interface ProductVectorMetadata {
    id: string;
    handle: string;
    title: string;
    price: string;
    imageUrl: string | null;
    productUrl: string;
    vendor?: string | null;
    productType?: string | null;
    tags?: string;
    [key: string]: any; // Index signature
}

// Structure of the final product card sent to frontend
interface ProductCardResponse {
    title: string;
    description: string;
    price: string;
    image: string | null;
    landing_page: string;
}

// Final API response structure
interface ChatApiResponse {
    ai_understanding: string;
    product_card?: ProductCardResponse;
    advice: string;
}

// Type for incoming history messages from the client
interface ClientHistoryMessage {
    role: 'user' | 'bot' | 'model'; // Allow 'model' role from client if needed, map later
    text?: string;
    // Add other potential fields from client if necessary, but filter before sending to Gemini
}


export async function POST(req: NextRequest) {
  let searchNote = "";

  try {
    // Use specific type for request body
    const body = await req.json() as { query: string; history?: ClientHistoryMessage[] };
    const { query, history = [] } = body; // Default history to empty array

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid query provided' }, { status: 400 });
    }
    const trimmedQuery = query.trim();
    console.log(`Processing query: "${trimmedQuery}"`);

    // Prepare history for Gemini, ensuring correct structure and filtering
    const geminiHistory: Content[] = history
        .filter(msg => msg.text && msg.text.trim().length > 0) // Ensure text exists
        .map(msg => ({
            // Map client roles ('bot') to Gemini roles ('model')
            role: msg.role === 'bot' ? 'model' : 'user', // Assume only user/bot from client
            parts: [{ text: msg.text as string }],
        }));

    // 1. Get AI Understanding, Advice, and Search Keywords
    const geminiResult = await callGeminiForUnderstanding(trimmedQuery, geminiHistory);

    if (!geminiResult) {
        console.error("Failed to get response from Gemini understanding call.");
        const fallbackResponse: ChatApiResponse = {
            ai_understanding: "I had trouble processing that request.",
            advice: "Could you please try rephrasing your question or try again shortly?",
        };
        return NextResponse.json(fallbackResponse, { status: 500 });
    }
    console.log("Gemini Result:", geminiResult);

    let finalProductCard: ProductCardResponse | undefined = undefined;
    const K = 1;
    const SIMILARITY_THRESHOLD = 0.70;

    // Helper function to perform the vector query
    const performVectorQuery = async (embedding: number[] | null): Promise<QueryResult<ProductVectorMetadata> | null> => {
        if (!embedding) {
            console.log("No embedding provided for vector query.");
            return null;
        }
        try {
            console.log(`Querying vector index '${UPSTASH_VECTOR_INDEX_NAME}' with embedding (first 5 values): ${embedding.slice(0, 5)}...`);
            const results = await vectorIndex.query<ProductVectorMetadata>({ // Add type parameter here
                vector: embedding,
                topK: K,
                includeMetadata: true,
            });
            if (results && results.length > 0) {
                 console.log(` -> Top match ID: ${results[0].id}, Score: ${results[0].score.toFixed(4)}, Metadata: ${results[0].metadata ? 'Present' : 'Missing'}`);
            } else {
                 console.log(" -> No results found for this vector query.");
            }
            return results?.[0] || null;
        } catch (error) {
            console.error(`Upstash Vector Query Error for index '${UPSTASH_VECTOR_INDEX_NAME}':`, error);
            searchNote = "\n(Note: There was an issue searching for products.)";
            return null;
        }
    };

    // --- Vector Search Logic ---
    let topMatch: QueryResult<ProductVectorMetadata> | null = null;
    let searchStageUsed = "None";

    const keywordEmbedding = geminiResult.search_keywords.trim().length > 0
        ? await generateEmbedding(geminiResult.search_keywords)
        : null;

    if (keywordEmbedding) {
        console.log("Attempting search with AI keywords...");
        topMatch = await performVectorQuery(keywordEmbedding);
        searchStageUsed = "AI Keywords";
    } else {
        console.log("Skipping keyword search as AI keywords are empty.");
    }

    if (!topMatch || topMatch.score < SIMILARITY_THRESHOLD) {
        const logReason = !topMatch ? "Keyword search yielded no result or was skipped" : `Keyword search score (${topMatch.score.toFixed(4)}) below threshold ${SIMILARITY_THRESHOLD}`;
        console.log(`${logReason}. Attempting search with direct query...`);

        const directQueryEmbedding = await generateEmbedding(trimmedQuery);

        if (directQueryEmbedding) {
            const directMatch = await performVectorQuery(directQueryEmbedding);
            searchStageUsed = "Direct Query";

            if (directMatch && directMatch.score >= SIMILARITY_THRESHOLD) {
                if (!topMatch || directMatch.score > topMatch.score) {
                    console.log(`Direct query search found a better match (Score: ${directMatch.score.toFixed(4)})`);
                    topMatch = directMatch;
                } else {
                    console.log(`Direct query match (Score: ${directMatch.score.toFixed(4)}) was not better than keyword match (Score: ${topMatch.score.toFixed(4)}). Keeping keyword match.`);
                    searchStageUsed = "AI Keywords (Kept)";
                }
            } else if (topMatch) {
                 console.log(`Direct query search did not yield a result above threshold. Keeping keyword result (Score: ${topMatch.score.toFixed(4)})`);
                 searchStageUsed = "AI Keywords (Kept)";
            } else {
                 console.log("Direct query search also failed or was below threshold.");
                 searchStageUsed = "Direct Query (Failed)";
            }
        } else {
            console.log("Skipped direct query search as embedding generation failed.");
             searchStageUsed = topMatch ? "AI Keywords (Kept)" : "None";
        }
    }

    // --- Process the final topMatch ---
    if (topMatch && topMatch.metadata && topMatch.score >= SIMILARITY_THRESHOLD) {
        // Ensure metadata is treated as the correct type
        const productData = topMatch.metadata as ProductVectorMetadata;
        console.log(`Final Match Found (using ${searchStageUsed}): "${productData.title}", Score: ${topMatch.score.toFixed(4)}`);

        finalProductCard = {
            title: productData.title,
            description: `Found product related to your query.`, // Placeholder
            price: productData.price,
            image: productData.imageUrl,
            landing_page: productData.productUrl,
        };
        searchNote = ""; // Clear notes on success

    } else {
        if (topMatch?.metadata) { // Check if metadata exists even if below threshold
            console.log(`Best match found (using ${searchStageUsed}) was below threshold: "${topMatch.metadata.title}", Score: ${topMatch.score.toFixed(4)}`);
            searchNote = "\n(I found something similar, but wasn't sure if it was the best match. Could you be more specific?)";
        } else {
            console.log(`No matching products found above threshold after ${searchStageUsed} stage.`);
            // Check if search was possible before adding note
            const searchAttempted = keywordEmbedding || (await generateEmbedding(trimmedQuery));
            if (searchAttempted) {
                 searchNote = "\n(I couldn't find specific products matching your request in the catalog right now.)";
            }
        }
        finalProductCard = undefined;
    }

    // 4. Construct Final Response
    const finalResponse: ChatApiResponse = {
      ai_understanding: geminiResult.ai_understanding,
      product_card: finalProductCard,
      advice: geminiResult.advice + searchNote,
    };

    console.log("Sending final response:", JSON.stringify(finalResponse, null, 2));
    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ChatApiResponse = {
        ai_understanding: "An error occurred.",
        advice: `Sorry, I encountered a problem processing your request. Please try again later. (Ref: ${errorMessage.substring(0,100)})`,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}