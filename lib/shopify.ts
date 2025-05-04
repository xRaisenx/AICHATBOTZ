// lib/shopify.ts
// Removed unused 'error' import from 'console'

// Define interfaces for the expected GraphQL response structure
interface ShopifyImage {
    url: string;
    altText?: string | null;
}

interface ShopifyPrice {
    amount: string;
    currencyCode: string;
}

export interface ShopifyProductNode {
    id: string;
    handle: string;
    title: string;
    bodyHtml: string | null;
    vendor: string | null;
    productType: string | null;
    tags: string[];
    onlineStoreUrl: string | null;
    featuredImage: ShopifyImage | null;
    priceRangeV2: {
        minVariantPrice: ShopifyPrice;
        maxVariantPrice: ShopifyPrice;
    };
}

interface ShopifyPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

interface ShopifyProductsEdges {
    node: ShopifyProductNode;
    cursor: string;
}

interface ShopifyProductsConnection {
    edges: ShopifyProductsEdges[];
    pageInfo: ShopifyPageInfo;
}

interface ShopifyGraphQLResponse {
    data?: {
        products: ShopifyProductsConnection;
    };
    // Use a more general type for extensions if specific structure isn't needed
    extensions?: Record<string, unknown>;
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

// --- Fetch Products Function ---
const SHOPIFY_API_VERSION = '2024-04';

export interface FetchResult {
    products: ShopifyProductNode[];
    nextPageCursor: string | null;
}

export async function fetchShopifyProducts(
    cursor: string | null = null,
    limit: number = 50
): Promise<FetchResult> {

    const storeDomain = process.env.SHOPIFY_STORE_NAME;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!storeDomain || !accessToken) {
        console.error("CRITICAL: Missing SHOPIFY_STORE_NAME or SHOPIFY_ADMIN_ACCESS_TOKEN");
        throw new Error("Shopify API credentials are not configured.");
    }

    const endpoint = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

    const query = `
      query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, query:"status:active") {
          edges {
            cursor
            node {
              id
              handle
              title
              bodyHtml
              vendor
              productType
              tags
              onlineStoreUrl
              featuredImage {
                url(transform: {maxWidth: 200, maxHeight: 200, preferredContentType: WEBP})
                altText
              }
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                    amount
                    currencyCode
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
        first: limit,
        after: cursor,
    };

    console.log(`Fetching Shopify products... Limit: ${limit}, After: ${cursor || 'Start'}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({ query, variables }),
            cache: 'no-store',
        });

        if (!response.ok) {
            let errorBody = `Shopify API request failed with status ${response.status}`;
            try { const textBody = await response.text(); errorBody += `\nResponse: ${textBody.substring(0, 500)}`; }
            catch { /* Ignore */ }
            console.error(errorBody);
            throw new Error(`Shopify API request failed with status ${response.status}`);
        }

        const jsonResponse: ShopifyGraphQLResponse = await response.json();

        if (jsonResponse.errors) {
            console.error("Shopify GraphQL Errors:", JSON.stringify(jsonResponse.errors, null, 2));
            const isRateLimited = jsonResponse.errors.some(e => e.extensions?.code === 'THROTTLED');
            if (isRateLimited) {
                console.warn("Shopify API rate limit likely hit.");
            }
            throw new Error(`Shopify GraphQL Error: ${jsonResponse.errors[0]?.message || 'Unknown GraphQL error'}`);
        }

        if (!jsonResponse.data?.products?.edges) {
             console.error("Invalid response structure from Shopify:", jsonResponse);
             throw new Error("Received invalid data structure from Shopify API.");
        }

        const productsData = jsonResponse.data.products;
        const products = productsData.edges.map(edge => edge.node);
        const pageInfo = productsData.pageInfo;

        console.log(` -> Fetched ${products.length} products. HasNextPage: ${pageInfo.hasNextPage}`);

        return {
            products: products,
            nextPageCursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
        };

    } catch (err) {
        console.error("Error during Shopify fetch:", err);
        throw err;
    }
}