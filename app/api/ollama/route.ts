/**
 * Next.js API Route - Proxy for Ollama API
 * Uses official Ollama NPM package for better reliability
 */

import { Ollama } from 'ollama';

export async function POST(request: Request) {
    try {
        const { endpoint, model, messages, options } = await request.json();

        // Validate required fields
        if (!endpoint || !model || !messages) {
            return Response.json(
                { error: "Missing required fields: endpoint, model, messages" },
                { status: 400 }
            );
        }

        // Create Ollama client with API key from environment
        const apiKey = process.env.OLLAMA_API_KEY;

        const ollama = new Ollama({
            host: endpoint,
            ...(apiKey && {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            })
        });

        // Make chat request (API key is read from OLLAMA_API_KEY env automatically)
        const response = await ollama.chat({
            model,
            messages,
            stream: false,
            options: options || {}
        });

        return Response.json(response);

    } catch (error) {
        console.error("❌ Ollama API error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
