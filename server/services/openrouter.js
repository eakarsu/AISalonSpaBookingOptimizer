require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function queryOpenRouter(systemPrompt, userPrompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Salon & Spa Booking Optimizer',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API error');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}

module.exports = { queryOpenRouter };
