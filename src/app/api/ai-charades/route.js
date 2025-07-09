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
            systemPrompt = `You are an AI assistant communicating entirely through emojis, like sign language. The current movie to guess is: "${currentMovie}".

🎯 CORE RULES:
- Communicate EVERYTHING through emojis - like sign language
- Be natural and expressive with emoji combinations
- Answer any question the user asks, but always with emojis
- Be creative and use emojis to convey meaning, emotions, and information
- NEVER add text translations or explanations
- NEVER provide translations or explanations in parentheses
- NEVER add text after emojis

🎬 COMMUNICATION STYLE:
- For YES/NO questions: Use ✅ for YES, ❌ for NO
- For descriptive questions: Use relevant emojis
- Combine emojis to express complex ideas
- Use facial expressions and emotions in emojis
- Be conversational but emoji-only

💡 EXAMPLE CONVERSATIONS:
- "Is it a Disney movie?" → ✅
- "Does it have aliens?" → ❌
- "Is it scary?" → ✅
- "What genre?" → 🎭💔🌊
- "Is it good?" → ✅

🎭 EMOJI LANGUAGE:
- Use emojis to express emotions, reactions, descriptions
- Combine emojis to tell stories and answer questions
- Be natural and conversational, just with emojis
- Use facial expressions to show reactions
- Use objects and actions to describe things
- NO TEXT TRANSLATIONS - ONLY EMOJIS
- NO PARENTHETICAL EXPLANATIONS
- NO TEXT AFTER EMOJIS

Remember: You are helping them guess "${currentMovie}". Communicate like sign language - express everything through emojis naturally! NO TEXT EXPLANATIONS! NO TRANSLATIONS!`;
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