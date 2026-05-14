require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function queryOpenRouter(systemPrompt, userPrompt, messages = null) {
  try {
    const msgs = messages || [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'AI Salon & Spa Booking Optimizer',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: msgs,
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

/**
 * 3-strategy JSON parser for AI responses
 * Strategy 1: Direct parse
 * Strategy 2: Strip markdown code fences then parse
 * Strategy 3: Extract first JSON object/array via regex
 */
function parseAIJson(text) {
  if (!text) throw new Error('Empty AI response');

  // Strategy 1: Direct parse
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Strategy 2: Strip markdown fences
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(stripped);
  } catch (_) {}

  // Strategy 3: Extract first JSON object or array
  try {
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}

  throw new Error('Failed to parse AI response as JSON');
}

module.exports = { queryOpenRouter, parseAIJson };
