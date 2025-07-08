import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { message, systemPrompt } = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_DEEPSEEK_API_KEY;
        const baseUrl = process.env.NEXT_DEEPSEEK_BASE_URL;
        if (!apiKey || !baseUrl) {
            return NextResponse.json({ error: 'API key or base URL not set' }, { status: 500 });
        }

        // Use provided systemPrompt or default to general chatbot
        const defaultPrompt = "You are a helpful AI assistant. Respond naturally to the user's questions and requests. Be informative, friendly, and conversational.";
        const finalSystemPrompt = systemPrompt || defaultPrompt;

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: finalSystemPrompt },
                    { role: 'user', content: message }
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error }, { status: response.status });
        }

        const data = await response.json();
        const aiMessage = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ message: aiMessage });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
} 