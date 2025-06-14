export async function generateIdea(prompt) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192', // ✅ Groq-supported model
          messages: [
            {
              role: 'system',
              content: 'You are a creative brainstorming assistant who generates specific, original, and helpful startup or project ideas. Each time you respond, you only respond with one idea at a time so the user can easily pick and add one.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 512,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Groq API error:', data);
        return null;
      }
  
      return data.choices?.[0]?.message?.content ?? null;
    } catch (err) {
      console.error('Groq fetch error:', err);
      return null;
    }
  }
  