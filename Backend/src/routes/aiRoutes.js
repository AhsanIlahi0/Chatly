const express = require('express');

const router = express.Router();

const normalizeMessages = (messages) =>
    messages.slice(-20).map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: String(message.content || '').slice(0, 8000)
    }));

router.post('/chat', async (req, res) => {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'At least one message is required.' });
    }

    const useGemini = (process.env.AI_PROVIDER || '').toLowerCase() === 'gemini' || Boolean(process.env.GEMINI_API_KEY);

    try {
        if (useGemini) {
            const geminiKey = process.env.GEMINI_API_KEY;
            const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

            if (!geminiKey) {
                return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to Backend/.env.' });
            }

            const payload = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: 'You are Chatly AI, a friendly and practical assistant inside a messaging app. Answer clearly and conversationally.' }]
                    },
                    ...normalizeMessages(messages).map((message) => ({
                        role: message.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: message.content }]
                    }))
                ],
                generationConfig: {
                    temperature: 0.7
                }
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                return res.status(response.status).json({
                    error: data.error?.message || 'The Gemini provider returned an error.'
                });
            }

            const text = data.candidates?.[0]?.content?.parts
                ?.map((part) => part.text)
                .join('')
                .trim();

            if (!text) {
                return res.status(502).json({ error: 'The Gemini provider returned an empty response.' });
            }

            return res.json({ text });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to Backend/.env.' });
        }

        const response = await fetch(process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are Chatly AI, a friendly and practical assistant inside a messaging app. Answer clearly and conversationally.'
                    },
                    ...normalizeMessages(messages)
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'The AI provider returned an error.' });
        }

        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) {
            return res.status(502).json({ error: 'The AI provider returned an empty response.' });
        }

        return res.json({ text });
    } catch (error) {
        console.error('AI request failed:', error);
        return res.status(502).json({ error: 'The AI is unavailable right now. Please try again.' });
    }
});

module.exports = router;