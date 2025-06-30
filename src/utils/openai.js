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
        // model: 'anthropic/claude-3.5-sonnet', // 🔄 swapped model here
        model: 'qwen/qwen2.5-vl-72b-instruct:free',
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

// Prompt generator for single idea (node button)
export function generateSingleIdeaPrompt({ rootNode, parentNodes = [], currentNode }) {
  const topicContext = [
    `Root Topic: ${rootNode}`,
    parentNodes.length ? `Parent Topics: ${parentNodes.join(' > ')}` : null,
    `Focused Node: ${currentNode}`,
  ].filter(Boolean).join('\n');

  return `
You are an AI creative thinking assistant. Given the following topic structure, generate **one** focused and imaginative idea that expands on the user's thinking.

${topicContext}

Respond with just the idea. No explanation or extra commentary.
  `.trim();
}

// Prompt generator for idea buffet (sidebar)
export function generateIdeaBuffetPrompt({ userPrompt, rootNode, numberOfIdeas = 5 }) {
  return `
You are an AI brainstorming chef creating a buffet of ideas for the user to sample. Based on the following root topic and user prompt, generate ${numberOfIdeas} diverse and creative ideas.

Root Topic: ${rootNode}
User Prompt: ${userPrompt}

Each idea should be short (1-3 sentences), clearly distinct, and numbered.

Avoid generic responses—aim for unique perspectives or playful twists.
  `.trim();
}

// Call OpenRouter Claude 3.5 Sonnet for a single idea (node button)
export async function generateSingleIdea({ rootNode, parentNodes = [], currentNode, temperature = 0.7 }) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OpenRouter API key is missing!');
    return '⚠️ Missing API key';
  }
  const prompt = generateSingleIdeaPrompt({ rootNode, parentNodes, currentNode });
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
        // model: 'anthropic/claude-3.5-sonnet',
        model: 'qwen/qwen2.5-vl-72b-instruct:free',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: 300,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return '⚠️ AI error';
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content;
  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return '⚠️ Network error';
  }
}

// Call OpenRouter Claude 3.5 Sonnet for a buffet of ideas (sidebar)
export async function generateIdeaBuffet({ userPrompt, rootNode, numberOfIdeas = 5, temperature = 0.7 }) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OpenRouter API key is missing!');
    return ['⚠️ Missing API key'];
  }
  const prompt = generateIdeaBuffetPrompt({ userPrompt, rootNode, numberOfIdeas });
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
        // model: 'anthropic/claude-3.5-sonnet',
        model: 'qwen/qwen2.5-vl-72b-instruct:free',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: 600,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return ['⚠️ AI error'];
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    // Parse numbered ideas (e.g., 1. Idea one\n2. Idea two...)
    if (content) {
      return content.split(/\n\s*\d+\.\s/).filter(Boolean).map((idea, idx) => {
        // If the first idea doesn't start with a number, include it
        if (idx === 0 && !/^\d+\./.test(content)) return idea.trim();
        return idea.trim();
      });
    }
    return [];
  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return ['⚠️ Network error'];
  }
}
