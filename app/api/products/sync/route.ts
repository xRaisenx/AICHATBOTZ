// app/api/products/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Import vectorIndex and standard redis client
import { vectorIndex, UPSTASH_VECTOR_INDEX_NAME } from '@/lib/redis';
import { fetchShopifyProducts } from '@/lib/shopify';
import { generateEmbedding } from '@/lib/gemini';
// No need for UpsertRequest import

// Define the metadata structure to store alongside the vector
interface ProductVectorMetadata {
    [key: string]: unknown;
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

export async function GET(req: NextRequest) {
    // --- Security Check ---
    const secret = req.nextUrl.searchParams.get('secret');
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET is not set.");
        return NextResponse.json({ error: 'Configuration error: Sync secret not set.' }, { status: 500 });
    }
    if (secret !== process.env.CRON_SECRET) {
        console.warn("Unauthorized sync attempt: Invalid secret.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log("Authorized sync request received.");
    // --- End Security Check ---

    let totalProcessed = 0;
    let totalFetched = 0;
    let totalErrors = 0;
    let nextPageCursor: string | null = null;
    const startTime = Date.now();
    const BATCH_SIZE_SHOPIFY = 50;
    const BATCH_SIZE_VECTOR = 100; // Batch size for Upstash Vector upsert

    // Type for the batch array - this remains the same, using our interface
    const vectorUpsertBatch: {
        id: string | number; // Vector ID can be string or number
        vector: number[];
        metadata: ProductVectorMetadata; // Use our interface here
    }[] = [];

    // Optional: Store hash set promises for batching
    // const hashSetPromises: Promise<any>[] = [];


    try {
        // --- NO ensureRedisIndex call needed ---
        console.log(`Step 1: Starting Shopify product fetch loop (Batch Size: ${BATCH_SIZE_SHOPIFY})...`);

        do {
            const fetchStartTime = Date.now();
            const fetchResult = await fetchShopifyProducts(nextPageCursor, BATCH_SIZE_SHOPIFY);
            const products = fetchResult.products;
            nextPageCursor = fetchResult.nextPageCursor;
            totalFetched += products.length;
            const fetchDuration = Date.now() - fetchStartTime;

            if (products.length === 0) {
                console.log("No more products returned from Shopify fetch.");
                break;
            }
            console.log(`Fetched batch of ${products.length} products in ${fetchDuration}ms. Next cursor: ${nextPageCursor ? 'Exists' : 'None'}`);

            // Process Batch: Generate Embeddings and Prepare Upserts
            console.log(` -> Processing batch of ${products.length} products for embedding and storage...`);
            const batchStartTime = Date.now();

            for (const product of products) {
                try {
                    if (!product.id || !product.handle || !product.title) {
                        console.warn(`Skipping product due to missing ID/Handle/Title: ${product.id || 'N/A'}`);
                        totalErrors++; continue;
                    }

                    // a) Prepare text for embedding
                    const cleanedDescription = product.bodyHtml?.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || '';
                    const textToEmbed = `Product: ${product.title}\nBrand: ${product.vendor || ''}\nType: ${product.productType || ''}\nTags: ${(product.tags || []).join(', ')}\nDescription: ${cleanedDescription.substring(0, 500)}`;

                    // b) Generate embedding
                    const embedding = await generateEmbedding(textToEmbed);
                    if (!embedding) {
                        console.warn(`Failed to generate embedding for product: ${product.title} (ID: ${product.id})`);
                        totalErrors++; continue;
                    }

                    // c) Prepare Vector Metadata
                    const productIdNumber = product.id.split('/').pop();
                    if (!productIdNumber) {
                        console.warn(`Could not extract numeric ID from ${product.id}`);
                        totalErrors++; continue;
                    }
                    const productUrl = product.onlineStoreUrl || `https://${process.env.SHOPIFY_STORE_NAME}/products/${product.handle}`;
                    let formattedPrice = "N/A";
                    const minPrice = product.priceRangeV2?.minVariantPrice;
                    const maxPrice = product.priceRangeV2?.maxVariantPrice;
                    if (minPrice?.amount) {
                        formattedPrice = `${minPrice.amount} ${minPrice.currencyCode}`;
                        if (maxPrice?.amount && maxPrice.amount !== minPrice.amount) {
                            formattedPrice = `${minPrice.amount} - ${maxPrice.amount} ${minPrice.currencyCode}`;
                        }
                    }
                    const tagsString = (product.tags || []).join(',');

                    // Create the metadata object using our interface
                    const metadata: ProductVectorMetadata = {
                        id: product.id, // Store Shopify GID in metadata
                        handle: product.handle,
                        title: product.title,
                        price: formattedPrice,
                        imageUrl: product.featuredImage?.url || null,
                        productUrl: productUrl,
                        vendor: product.vendor,
                        productType: product.productType,
                        tags: tagsString,
                    };

                    // Add to vector upsert batch
                    // TypeScript is now happy because ProductVectorMetadata is assignable to Dict
                    // due to the added index signature.
                    vectorUpsertBatch.push({
                        id: productIdNumber, // Use numeric product ID as the Vector ID
                        vector: embedding,
                        metadata: metadata // Attach the prepared metadata
                    });

                    // Optional: Prepare and batch HSET for full data
                    /*
                    const hashData: ProductHashData = { ...metadata, description: cleanedDescription.substring(0, 1000) };
                    const redisKey = `${REDIS_PRODUCT_KEY_PREFIX}${productIdNumber}`;
                    hashSetPromises.push(redis.hset(redisKey, hashData));
                    */

                    totalProcessed++;

                    // d) Upsert vectors in batches
                    if (vectorUpsertBatch.length >= BATCH_SIZE_VECTOR) {
                        console.log(` -> Upserting ${vectorUpsertBatch.length} vectors to index '${UPSTASH_VECTOR_INDEX_NAME}'...`);
                        // Use the vectorIndex client from lib/redis.ts
                        await vectorIndex.upsert(vectorUpsertBatch); // This assignment is now valid
                        vectorUpsertBatch.length = 0; // Clear the batch
                        // Optional: await Promise.all(hashSetPromises); hashSetPromises.length = 0;
                    }

                } catch (productError) {
                    console.error(`Error processing product ${product.id} (${product.title}):`, productError);
                    totalErrors++;
                }
            } // End for loop (processing products in fetched batch)

            const batchDuration = Date.now() - batchStartTime;
            console.log(` -> Finished processing batch in ${batchDuration}ms. Processed so far: ${totalProcessed}, Errors: ${totalErrors}`);

        } while (nextPageCursor); // Continue while Shopify indicates more pages

        // Upsert any remaining vectors in the last batch
        if (vectorUpsertBatch.length > 0) {
            console.log(` -> Upserting final ${vectorUpsertBatch.length} vectors to index '${UPSTASH_VECTOR_INDEX_NAME}'...`);
            await vectorIndex.upsert(vectorUpsertBatch); // Also valid here
            // Optional: await Promise.all(hashSetPromises);
        }

        const duration = (Date.now() - startTime) / 1000;
        const summary = `Sync complete in ${duration.toFixed(2)}s. Total Fetched: ${totalFetched}, Successfully Processed & Upserted: ${totalProcessed}, Errors: ${totalErrors}`;
        console.log(summary);
        return NextResponse.json({ message: summary });

    } catch (error) {
        console.error('Product Sync Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Sync failed: ${errorMessage}` }, { status: 500 });
    }
}