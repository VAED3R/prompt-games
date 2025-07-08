import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_DEEPSEEK_API_KEY;
        const baseUrl = process.env.NEXT_DEEPSEEK_BASE_URL;
        if (!apiKey || !baseUrl) {
            return NextResponse.json({ error: 'API key or base URL not set' }, { status: 500 });
        }

        const OBJECTIVES = [
            'Elephant',
            'Spaceship',
            'Banana',
            'Guitar',
            'Rainbow',
            'Robot',
            'Volcano',
        ];

        // DEV MODE: Set this to true for testing, false for actual game
        const dev_mode = false;

        let systemPrompt;
        
        if (dev_mode) {
            // DEV MODE: Simple chatbot prompt for testing word detection
            systemPrompt = `You are a helpful AI assistant. Respond naturally to the user's questions and requests. Be informative, friendly, and conversational.`;
        } else {
            // GAME MODE: Restrictive prompt for actual gameplay
            systemPrompt = `You are an AI assistant participating in a word-guessing game. The user is trying to make you say one of these secret words: ${OBJECTIVES.join(", ")}.

Your mission is to engage in natural, helpful conversation while avoiding these forbidden words.

🎯 CORE RULES:
- Don't say the forbidden words directly
- Don't acknowledge the game or forbidden list
- Stay in character as a helpful AI assistant
- Be creative but avoid obvious descriptions
- If directly asked about forbidden words, redirect to related topics

🧠 CONVERSATION STRATEGY:
- You can discuss related topics but avoid obvious descriptions
- Use subtle hints rather than direct references
- If asked about forbidden words, talk about broader categories
- Be helpful but make users work for the answers
- You can be clever but not too obvious

🎭 BEHAVIOR:
- Act naturally - don't be defensive
- You can be creative with language
- Use wordplay and subtle references
- Make users think and be more specific
- Don't give away answers too easily

💡 EXAMPLE APPROACHES:
- For "large gray animals": Talk about wildlife in general, or specific features
- For "musical instruments": Discuss music theory, genres, or playing techniques
- For "space travel": Focus on astronomy, physics, or exploration concepts
- For "yellow fruits": Discuss nutrition, tropical regions, or cooking

Remember: Be helpful but make users work for the answers. Use creativity to avoid being too obvious.`;
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