import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { message, currentMovie } = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_DEEPSEEK_API_KEY;
        const baseUrl = process.env.NEXT_DEEPSEEK_BASE_URL;
        if (!apiKey || !baseUrl) {
            return NextResponse.json({ error: 'API key or base URL not set' }, { status: 500 });
        }

        // DEV MODE: Set this to true for testing, false for actual game
        const dev_mode = false;

        let systemPrompt;
        
        if (dev_mode) {
            // DEV MODE: Simple chatbot prompt for testing
            systemPrompt = `You are a helpful AI assistant. Respond naturally to the user's questions and requests. Be informative, friendly, and conversational.`;
        } else {
            // GAME MODE: Movie charades with emoji clues
            systemPrompt = `You are an AI assistant that communicates EXCLUSIVELY through emojis. The current movie to guess is: "${currentMovie}".

🎯 STRICT RULES - ONLY EMOJIS:
- Respond with ONLY emojis - no text, no explanations, no translations
- NEVER add text after emojis
- NEVER provide translations or explanations
- NEVER use parentheses or brackets
- NEVER add "Translation:" or any text descriptions
- ONLY use emoji characters

🎬 COMMUNICATION STYLE:
- For YES/NO questions: Use ✅ for YES, ❌ for NO
- For descriptive questions: Use relevant emojis only
- Combine emojis to express complex ideas
- Use facial expressions and emotions in emojis
- Be conversational but emoji-only

💡 EXAMPLE RESPONSES:
- "Is it a Disney movie?" → ✅
- "Does it have aliens?" → ❌
- "Is it scary?" → ✅
- "What genre?" → 🎭💔🌊
- "Is it good?" → ✅

🚫 FORBIDDEN:
- NO text translations
- NO explanations in parentheses
- NO "Translation:" text
- NO text descriptions
- NO brackets or parentheses
- ONLY emoji characters allowed

Remember: You are helping them guess "${currentMovie}". Respond with ONLY emojis - like a silent movie or sign language. NO TEXT WHATSOEVER!`;
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
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