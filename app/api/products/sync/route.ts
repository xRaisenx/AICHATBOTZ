// app/api/products/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { vectorIndex, UPSTASH_VECTOR_INDEX_NAME } from '@/lib/redis';
// Removed unused ShopifyProductNode import as it's defined in lib/shopify.ts
import { fetchShopifyProducts } from '@/lib/shopify';
import { generateEmbedding } from '@/lib/gemini';
// Import only if using HSET separately
// import { redis, REDIS_PRODUCT_KEY_PREFIX } from '@/lib/redis';

// Define the metadata structure to store alongside the vector
interface ProductVectorMetadata {
    [key: string]: any; // Index signature for compatibility
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

// Optional: Structure for storing full details in a separate HASH
// interface ProductHashData extends ProductVectorMetadata {
//     description: string;
// }


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
    const BATCH_SIZE_VECTOR = 100;

    const vectorUpsertBatch: {
        id: string | number;
        data: string; // Text to be embedded by Upstash
        metadata: ProductVectorMetadata;
    }[] = [];

    // Optional: Store hash set promises for batching
    // const hashSetPromises: Promise<unknown>[] = []; // Use unknown instead of any


    try {
        console.log(`Targeting Upstash Vector Index: ${UPSTASH_VECTOR_INDEX_NAME}`);
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

            console.log(` -> Processing batch of ${products.length} products for storage...`);
            const batchStartTime = Date.now();

            for (const product of products) {
                try {
                    if (!product.id || !product.handle || !product.title) {
                        console.warn(`Skipping product due to missing ID/Handle/Title: ${product.id || 'N/A'}`);
                        totalErrors++; continue;
                    }

                    // a) Prepare text data for Upstash to embed
                    const cleanedDescription = product.bodyHtml?.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || '';
                    const textDataForEmbedding = `Product: ${product.title}\nBrand: ${product.vendor || ''}\nType: ${product.productType || ''}\nTags: ${(product.tags || []).join(', ')}\nDescription: ${cleanedDescription.substring(0, 500)}`;

                    // b) NO external embedding generation needed

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

                    const metadata: ProductVectorMetadata = {
                        id: product.id,
                        handle: product.handle,
                        title: product.title,
                        price: formattedPrice,
                        imageUrl: product.featuredImage?.url || null,
                        productUrl: productUrl,
                        vendor: product.vendor,
                        productType: product.productType,
                        tags: tagsString,
                    };

                    // Add to vector upsert batch with 'data' field
                    vectorUpsertBatch.push({
                        id: productIdNumber,
                        data: textDataForEmbedding, // Pass the text string
                        metadata: metadata
                    });

                    // Optional: Prepare and batch HSET for full data in standard KV
                    /*
                    if (redis) {
                        const hashData: ProductHashData = { ...metadata, description: cleanedDescription.substring(0, 1000) };
                        const redisKey = `${REDIS_PRODUCT_KEY_PREFIX}${productIdNumber}`;
                        hashSetPromises.push(redis.hset(redisKey, hashData));
                    }
                    */

                    totalProcessed++;

                    // d) Upsert vectors (data) in batches
                    if (vectorUpsertBatch.length >= BATCH_SIZE_VECTOR) {
                        console.log(` -> Upserting ${vectorUpsertBatch.length} data items (for embedding) to Upstash Vector index '${UPSTASH_VECTOR_INDEX_NAME}'...`);
                        await vectorIndex.upsert(vectorUpsertBatch); // Upsert data and metadata
                        vectorUpsertBatch.length = 0; // Clear the batch
                        // Optional: await Promise.all(hashSetPromises); hashSetPromises.length = 0;
                    }

                } catch (productError) {
                    console.error(`Error processing product ${product.id} (${product.title}):`, productError);
                    totalErrors++;
                }
            } // End for loop

            const batchDuration = Date.now() - batchStartTime;
            console.log(` -> Finished processing batch in ${batchDuration}ms. Processed so far: ${totalProcessed}, Errors: ${totalErrors}`);

        } while (nextPageCursor);

        // Upsert any remaining items
        if (vectorUpsertBatch.length > 0) {
            console.log(` -> Upserting final ${vectorUpsertBatch.length} data items to Upstash Vector index '${UPSTASH_VECTOR_INDEX_NAME}'...`);
            try {
                await vectorIndex.upsert(vectorUpsertBatch);
                // Optional: await Promise.all(hashSetPromises);
            } catch (upsertError) {
                 console.error(`Error upserting final batch:`, upsertError);
                 totalErrors += vectorUpsertBatch.length;
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        const summary = `Sync complete in ${duration.toFixed(2)}s. Total Fetched: ${totalFetched}, Successfully Processed & Attempted Upsert: ${totalProcessed}, Errors during processing/upsert: ${totalErrors}`;
        console.log(summary);
        return NextResponse.json({ message: summary, processed: totalProcessed, errors: totalErrors });

    } catch (error) {
        console.error('Product Sync Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Sync failed: ${errorMessage}` }, { status: 500 });
    }
}