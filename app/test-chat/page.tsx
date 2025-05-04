// app/test-chat/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { testQueries } from '@/lib/testQueries'; // Import the queries
import { ProductCard } from '@/components/ProductCard'; // Reuse ProductCard component

// Define the expected structure of the API response
interface ProductCardResponse {
    title: string;
    description: string;
    price: string;
    image: string | null;
    landing_page: string;
}

interface ChatApiResponse {
    ai_understanding?: string;
    product_card?: ProductCardResponse;
    advice?: string;
    error?: string;
}

export default function TestChatPage() {
    const [selectedQuery, setSelectedQuery] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ChatApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleQuerySelect = (query: string) => {
        setSelectedQuery(query);
        setResult(null);
        setError(null);
    };

    const handleTestQuery = useCallback(async () => {
        if (!selectedQuery || loading) return;

        setLoading(true);
        setResult(null);
        setError(null);
        console.log(`Testing query: "${selectedQuery}"`);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: selectedQuery, history: [] }),
            });

            // Check if response is ok before parsing
            if (!response.ok) {
                 let errorMsg = `Request failed with status ${response.status}`;
                 try {
                     const errorData = await response.json();
                     errorMsg = errorData.error || errorMsg;
                 } catch { /* Ignore parsing error */ }
                 throw new Error(errorMsg);
            }

            const data: ChatApiResponse = await response.json();
            console.log("API Response:", data);
            setResult(data);

        } catch (err) {
            console.error("Chat API test error:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [selectedQuery, loading]);

    return (
        <div className="container mx-auto p-6 md:p-8 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
                Chat API Test Page
            </h1>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Select a query from the list below and click "Test Query" to send it to the
                <code>/api/chat</code> endpoint and view the structured response.
                This helps validate AI understanding, advice generation, and product search relevance.
            </p>

            {/* Query Selection */}
            <div className="mb-6">
                <label htmlFor="query-select" className="block text-sm font-medium mb-2">Select Test Query:</label>
                <select
                    id="query-select"
                    value={selectedQuery}
                    onChange={(e) => handleQuerySelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary text-sm"
                >
                    <option value="" disabled>-- Select a query --</option>
                    {testQueries.map((query, index) => (
                        <option key={index} value={query}>
                            {index + 1}. {query.substring(0, 100)}{query.length > 100 ? '...' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selected Query Display and Test Button */}
            {selectedQuery && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium mb-2">Selected Query:</p>
                    <p className="text-sm italic mb-4">"{selectedQuery}"</p>
                    <button
                        onClick={handleTestQuery}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane className="-ml-1 mr-2 h-4 w-4" />
                                Test Query
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && !result && !error && (
                 <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                    <FaSpinner className="animate-spin inline-block mr-2" /> Loading response...
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200">
                     <h3 className="font-semibold mb-2 text-red-900 dark:text-red-100">Test Error:</h3>
                    <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                </div>
            )}

            {/* Result Display */}
            {result && !loading && (
                <div className="mt-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">API Response</h2>

                    <div className="mb-4">
                        <h3 className="font-medium text-sm uppercase text-gray-500 dark:text-gray-400 mb-1">AI Understanding:</h3>
                        <p className="text-sm italic bg-gray-100 dark:bg-gray-700 p-2 rounded">
                            {result.ai_understanding || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium text-sm uppercase text-gray-500 dark:text-gray-400 mb-1">Product Card Found:</h3>
                        {result.product_card ? (
                            <div className="max-w-md">
                                <ProductCard {...result.product_card} />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic p-2 rounded bg-gray-100 dark:bg-gray-700">
                                No relevant product card returned for this query.
                            </p>
                        )}
                    </div>

                    <div>
                        <h3 className="font-medium text-sm uppercase text-gray-500 dark:text-gray-400 mb-1">Advice / Response Text:</h3>
                        <div
                            // Apply prose styles for basic HTML formatting from AI
                            className="prose prose-sm dark:prose-invert max-w-none p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                            dangerouslySetInnerHTML={{ __html: result.advice || '<span class="text-gray-400 dark:text-gray-500">N/A</span>' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}