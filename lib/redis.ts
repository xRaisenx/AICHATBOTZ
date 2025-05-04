// lib/redis.ts
import { Redis } from '@upstash/redis'; // Standard client for HASH, etc.
import { Index } from '@upstash/vector'; // Vector client for search/upsert

// --- Configuration ---
// VECTOR_DIMENSIONS is now implicit based on the Upstash model configured for the index
export const UPSTASH_VECTOR_INDEX_NAME = process.env.UPSTASH_VECTOR_INDEX_NAME || 'products-index';
export const REDIS_PRODUCT_KEY_PREFIX = process.env.REDIS_PRODUCT_KEY_PREFIX || 'product:';

// --- Standard Upstash Redis/KV Client (@upstash/redis) ---
// Used ONLY if you store full product details in HASH separately
const standardKvUrl = process.env.UPSTASH_REDIS_REST_URL;
const standardKvToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!standardKvUrl || !standardKvToken) {
  console.warn('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Standard Redis client operations might fail if used.');
}
export const redis = new Redis({
  url: standardKvUrl || 'https://mock-url-if-missing.upstash.io',
  token: standardKvToken || 'mock_token_if_missing',
});


// --- Upstash VECTOR DATABASE Client (@upstash/vector) ---
// Uses the DEDICATED Vector Database REST URL and Token via new env vars
const vectorDbUrl = process.env.VECTOR_URL_BM25;
const vectorDbToken = process.env.VECTOR_TOKEN_BM25;

if (!vectorDbUrl || !vectorDbToken) {
    console.error('CRITICAL: Missing VECTOR_URL_BM25 or VECTOR_TOKEN_BM25 for Vector client. Vector operations WILL fail.');
    throw new Error('Missing Upstash Vector Database REST API credentials.');
}

// Initialize the Vector Index client pointing to the dedicated Vector DB
export const vectorIndex = new Index({
    url: vectorDbUrl,    // Use dedicated Vector DB URL
    token: vectorDbToken, // Use dedicated Vector DB Token
});

console.log(`Standard Redis client target: ${standardKvUrl || 'Not Configured'}`);
console.log(`Upstash Vector client target: ${vectorDbUrl}`);

// --- NO ensureRedisIndex function ---
// Index creation/management for Upstash Vector is handled via Upstash console/CLI.
// IMPORTANT: The index MUST be configured in Upstash to use an embedding model if you use the 'data' field for upsert/query.