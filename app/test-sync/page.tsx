// app/test-sync/page.tsx
'use client';

import React, { useState } from 'react';

export default function TestSyncPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        // Prompt for secret - ONLY FOR DEVELOPMENT/TESTING
        const secret = prompt("Enter the Product Sync Secret (CRON_SECRET):");
        if (!secret) {
            setError("Sync cancelled: Secret not provided.");
            setLoading(false);
            return;
        }

        try {
            // Add timestamp to prevent browser caching if needed
            const url = `/api/products/sync?secret=${encodeURIComponent(secret)}&t=${Date.now()}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }
            setResult(data.message || 'Sync completed successfully.');

        } catch (err) {
            console.error("Sync error:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during sync.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Test Product Sync</h1>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                This page triggers the product synchronization process from Shopify to Redis.
                This involves fetching products, generating embeddings, and storing data.
                It can take a significant amount of time depending on the number of products. Check server logs for progress.
            </p>
            <p className="mb-4 text-red-600 dark:text-red-400 text-sm font-semibold">
                ⚠️ WARNING: Requires the correct `CRON_SECRET` environment variable set on the server
                and entered below. For development/testing only.
            </p>

            <button
                onClick={handleSync}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Syncing...' : 'Start Product Sync'}
            </button>

            {loading && (
                <div className="mt-4 text-blue-600 dark:text-blue-400 animate-pulse">
                    Syncing in progress. This may take several minutes. Please check the server logs for details...
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200">
                    <h3 className="font-semibold mb-2">Sync Result:</h3>
                    <pre className="text-sm whitespace-pre-wrap">{result}</pre>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200">
                     <h3 className="font-semibold mb-2">Sync Error:</h3>
                    <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                </div>
            )}
        </div>
    );
}