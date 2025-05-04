// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Import vectorIndex for querying
import { vectorIndex, UPSTASH_VECTOR_INDEX_NAME } from '@/lib/redis';
// Import only Gemini for understanding/advice, NOT for embedding
import { callGeminiForUnderstanding } from '@/lib/gemini';
import { Content } from '@google/generative-ai';
import { QueryResult } from '@upstash/vector';

// Metadata structure expected from vector search results
interface ProductVectorMetadata {
    [key: string]: string | number | boolean | null | undefined;
    id: string;
    handle: string;
    title: string;
    price: string;
    imageUrl: string | null;
    productUrl: string;
    vendor?: string | null;
    productType?: string | null;
    tags?: string;
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

export async function POST(req: NextRequest) {
  let searchNote = "";

  try {
    const body = await req.json();
    const { query, history = [] } = body as { query: string; history: Array<{ role: 'user' | 'bot' | 'model', text?: string }> };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid query provided' }, { status: 400 });
    }
    const trimmedQuery = query.trim();
    console.log(`Processing query: "${trimmedQuery}"`);

    const geminiHistory: Content[] = history
        .filter(msg => msg.text && msg.text.trim().length > 0)
        .map(msg => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text as string }]
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
    const SIMILARITY_THRESHOLD = 0.70; // Threshold for Upstash's model similarity

    // Helper function to perform the vector query using 'data' field
    const performVectorQuery = async (searchText: string): Promise<QueryResult<ProductVectorMetadata> | null> => {
        if (!searchText || searchText.trim().length === 0) {
            console.log("No search text provided for vector query.");
            return null;
        }
        try {
            console.log(`Querying vector index '${UPSTASH_VECTOR_INDEX_NAME}' with data: "${searchText.substring(0, 70)}..."`);
            // *** USE vectorIndex.query with 'data' ***
            const results = await vectorIndex.query({
                data: searchText, // Pass the text for Upstash to embed
                topK: K,
                includeMetadata: true, // Get the product details
            });
            if (results && results.length > 0) {
                 console.log(` -> Top match ID: ${results[0].id}, Score: ${results[0].score.toFixed(4)}, Metadata: ${results[0].metadata ? 'Present' : 'Missing'}`);
            } else {
                 console.log(" -> No results found for this vector query.");
            }
            return results?.[0] as QueryResult<ProductVectorMetadata> || null;
        } catch (error) {
            console.error(`Upstash Vector Query Error for index '${UPSTASH_VECTOR_INDEX_NAME}':`, error);
            searchNote = "\n(Note: There was an issue searching for products.)";
            return null;
        }
    };

    // --- Vector Search Logic ---
    let topMatch: QueryResult<ProductVectorMetadata> | null = null;
    let searchStageUsed = "None";

    // Stage 1: Search using AI Keywords (if available)
    if (geminiResult.search_keywords.trim().length > 0) {
        console.log("Attempting search with AI keywords...");
        topMatch = await performVectorQuery(geminiResult.search_keywords);
        searchStageUsed = "AI Keywords";
    } else {
        console.log("Skipping keyword search as AI keywords are empty.");
    }

    // Stage 2: Search using Direct Query (if Stage 1 failed or below threshold)
    if (!topMatch || topMatch.score < SIMILARITY_THRESHOLD) {
        const logReason = !topMatch ? "Keyword search yielded no result or was skipped" : `Keyword search score (${topMatch.score.toFixed(4)}) below threshold ${SIMILARITY_THRESHOLD}`;
        console.log(`${logReason}. Attempting search with direct query...`);

        const directMatch = await performVectorQuery(trimmedQuery); // Use direct query text
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
    }

    // --- Process the final topMatch ---
    if (topMatch && topMatch.metadata && topMatch.score >= SIMILARITY_THRESHOLD) {
        const productData = topMatch.metadata;
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
        if (topMatch) {
            console.log(`Best match found (using ${searchStageUsed}) was below threshold: "${topMatch.metadata?.title}", Score: ${topMatch.score.toFixed(4)}`);
            searchNote = "\n(I found something similar, but wasn't sure if it was the best match. Could you be more specific?)";
        } else {
            console.log(`No matching products found above threshold after ${searchStageUsed} stage.`);
            // Add note only if a search was actually attempted
            if (geminiResult.search_keywords.trim().length > 0 || trimmedQuery.length > 0) {
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