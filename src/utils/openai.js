export async function generateIdea(rootLabel, detailLabel = '', temperature = 0.7) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OpenRouter API key is missing!');
    return { title: '⚠️ Missing API key', summary: 'Check your environment configuration.' };
  }

  const fullPrompt = detailLabel
    ? `Give me one unique idea related to "${rootLabel}" that focuses on "${detailLabel}".`
    : `Give me one unique idea about "${rootLabel}".`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'ThinkFlow',
      },
      body: JSON.stringify({
        model: 'qwen/qwen2.5-vl-72b-instruct:free', // 🔄 swapped model here
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful brainstorming assistant. Always respond in *only* valid JSON format like: {"title": "...", "summary": "..."} — no extra text. Keep it concise and creative.',
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        temperature,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return { title: '⚠️ AI error', summary: 'Try again later.' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse idea JSON:', content);
      return { title: '🫠 Could not parse idea', summary: content };
    }
  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return { title: '⚠️ Network error', summary: 'Something went wrong with your request.' };
  }
}
