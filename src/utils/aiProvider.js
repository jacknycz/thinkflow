// AI Provider Abstraction Layer
// Routes all AI calls to the correct provider based on selection

// Provider configurations
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Latest)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'VITE_OPENAI_API_KEY',
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL (Free)' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)' },
      { id: 'google/gemini-pro:free', name: 'Gemini Pro (Free)' },
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
  },
  groq: {
    name: 'Groq',
    models: [
      { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
      { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'VITE_GROQ_API_KEY',
  },
};

// Get provider configuration
export function getProviderConfig(provider) {
  return PROVIDERS[provider] || PROVIDERS.openai;
}

// Get all available providers and models
export function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    models: config.models,
  }));
}

// Generic AI call function
async function makeAICall(provider, model, messages, options = {}) {
  const config = getProviderConfig(provider);
  const apiKey = import.meta.env[config.apiKeyEnv];
  
  if (!apiKey) {
    console.error(`${config.name} API key is missing!`);
    return { error: 'Missing API key', content: `⚠️ Missing ${config.name} API key` };
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Add OpenRouter specific headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ThinkFlow';
  }

  const body = {
    model,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 300,
  };

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${config.name} API error:`, errorText);
      return { error: 'API error', content: '⚠️ AI error' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    
    return { content };
  } catch (error) {
    console.error(`${config.name} fetch error:`, error);
    return { error: 'Network error', content: '⚠️ Network error' };
  }
}

// Prompt templates
const promptTemplates = {
  question: (context) => `Given the following context:\n${context}\nGenerate a thought-provoking question about the topic, followed by 2-3 sentences explaining why this question matters or what it could lead to.`,
  idea: (context) => `Given the following context:\n${context}\nSuggest a creative idea that builds on or relates to it. Then provide 2-3 sentences explaining the potential impact or implementation details.`,
  task: (context) => `Given the following context:\n${context}\nWhat is a specific task someone could do related to it? Then provide 2-3 sentences explaining the steps, benefits, or considerations for this task.`,
  note: (context) => `Given the following context:\n${context}\nWrite a short note or reflection someone might have about it. Then expand with 2-3 sentences of deeper thoughts or implications.`,
};

// Generate single idea with provider selection
export async function generateSingleIdea({ 
  rootNode, 
  parentNodes = [], 
  currentNode, 
  temperature = 0.7, 
  promptType = 'idea',
  provider = 'openai',
  model = 'gpt-4o'
}) {
  // Build the combined context string
  const contextParts = [];
  if (rootNode) contextParts.push(`Root: ${rootNode}`);
  parentNodes.forEach((p, i) => contextParts.push(`Parent ${i + 1}: ${p}`));
  if (currentNode) contextParts.push(`Current: ${currentNode}`);

  const context = contextParts.join('\n');
  const prompt = promptTemplates[promptType](context);

  const result = await makeAICall(provider, model, [
    { role: 'user', content: prompt }
  ], { temperature, max_tokens: 300 });

  return result.content || result.error;
}

// Generate idea buffet with provider selection
export async function generateIdeaBuffet({ 
  userPrompt, 
  rootNode, 
  numberOfIdeas = 5, 
  temperature = 0.7,
  provider = 'openai',
  model = 'gpt-4o'
}) {
  const prompt = `You are an AI brainstorming chef creating a buffet of ideas for the user to sample. Based on the following root topic and user prompt, generate ${numberOfIdeas} diverse and creative ideas.

Root Topic: ${rootNode}
User Prompt: ${userPrompt}

Each idea should be short (1-3 sentences), clearly distinct, and numbered.

Avoid generic responses—aim for unique perspectives or playful twists.`;

  const result = await makeAICall(provider, model, [
    { role: 'user', content: prompt }
  ], { temperature, max_tokens: 600 });

  if (result.error) {
    return [result.content];
  }

  // Parse numbered ideas (e.g., 1. Idea one\n2. Idea two...)
  if (result.content) {
    return result.content.split(/\n\s*\d+\.\s/).filter(Boolean).map((idea, idx) => {
      // If the first idea doesn't start with a number, include it
      if (idx === 0 && !/^\d+\./.test(result.content)) return idea.trim();
      return idea.trim();
    });
  }
  return [];
}

// Generate prompt with context (for file uploads)
export async function generatePromptWithContext({ 
  userPrompt, 
  rootNode, 
  parentNodes = [], 
  currentNode, 
  vectorResults = [],
  temperature = 0.7,
  provider = 'openai',
  model = 'gpt-4o'
}) {
  // Build the node context
  const contextParts = [];
  if (rootNode) contextParts.push(`Root Topic: ${rootNode}`);
  parentNodes.forEach((p, i) => contextParts.push(`Parent ${i + 1}: ${p}`));
  if (currentNode) contextParts.push(`Current Node: ${currentNode}`);

  const nodeContext = contextParts.join('\n');

  // Build the vector search context (prioritized)
  let vectorContext = '';
  if (vectorResults && vectorResults.length > 0) {
    vectorContext = `\n\nRELEVANT CONTENT FROM UPLOADED FILES (HIGH PRIORITY):\n${vectorResults.map((result, i) => 
      `${i + 1}. From file "${result.file_name}": ${result.content}`
    ).join('\n')}`;
  }

  const systemPrompt = `You are an AI assistant that helps users think through ideas and concepts. 

IMPORTANT: When responding, prioritize the user's specific prompt and the context from their uploaded files over general AI knowledge. The uploaded content represents the user's specific knowledge and should be the primary source of information.

Your response should be thoughtful, relevant, and directly address the user's prompt while incorporating relevant information from their uploaded files when available.`;

  const userMessage = `User Prompt: ${userPrompt}

${nodeContext}${vectorContext}

Please provide a comprehensive response that directly addresses the user's prompt, prioritizing their uploaded content when relevant.`;

  const result = await makeAICall(provider, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { temperature, max_tokens: 800 });

  return result.content || result.error;
}

// Legacy function for backward compatibility
export async function generateIdea(rootLabel, detailLabel = '', temperature = 0.7, provider = 'openai', model = 'gpt-4o') {
  const fullPrompt = detailLabel
    ? `Give me one unique idea related to "${rootLabel}" that focuses on "${detailLabel}".`
    : `Give me one unique idea about "${rootLabel}".`;

  const result = await makeAICall(provider, model, [
    {
      role: 'system',
      content: 'You are a helpful brainstorming assistant. Always respond in *only* valid JSON format like: {"title": "...", "summary": "..."} — no extra text. Keep it concise and creative.',
    },
    {
      role: 'user',
      content: fullPrompt,
    }
  ], { temperature, max_tokens: 300 });

  if (result.error) {
    return { title: result.content, summary: 'Check your environment configuration.' };
  }

  try {
    return JSON.parse(result.content);
  } catch (e) {
    console.error('Failed to parse idea JSON:', result.content);
    return { title: '🫠 Could not parse idea', summary: result.content };
  }
}

// Keep the embedding function as-is since it's OpenAI specific
export async function getOpenAIEmbedding(text) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OpenAI API key');
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  const data = await response.json();
  if (!data.data || !data.data[0]?.embedding) throw new Error('No embedding returned');
  return data.data[0].embedding;
} 