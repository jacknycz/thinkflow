# AI Provider Abstraction

ThinkFlow now supports multiple AI providers and models through a unified abstraction layer. This allows users to choose their preferred AI provider and model for generating ideas and responses.

## Supported Providers

### OpenAI
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **API Key**: `VITE_OPENAI_API_KEY`
- **Default**: GPT-4o (Latest)

### OpenRouter
- **Models**: Claude 3.5 Sonnet, Qwen 2.5 VL (Free), Llama 3.1 8B (Free), Gemini Pro (Free)
- **API Key**: `VITE_OPENROUTER_API_KEY`
- **Features**: Access to multiple AI models through a single API

### Groq
- **Models**: Llama 3 70B, Llama 3 8B, Mixtral 8x7B
- **API Key**: `VITE_GROQ_API_KEY`
- **Features**: Fast inference speeds

## How to Use

### In the Sidebar
1. Select your preferred AI provider from the dropdown
2. Choose the specific model you want to use
3. Enter your prompt and click "Ask" to generate ideas

### In Node Toolbar
1. Click the AI generation button (✨) on any node
2. Choose the type of response (question, idea, task, note)
3. Select your preferred AI provider and model
4. Click "Generate" to create a new connected node

### Global State
The selected AI provider and model are stored in global state and persist across the session. All AI generation calls will use the currently selected provider/model.

## Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_GROQ_API_KEY=your_groq_api_key
```

## Technical Implementation

### AI Provider Abstraction (`src/utils/aiProvider.js`)
- Centralized routing for all AI calls
- Provider-specific API configurations
- Unified error handling
- Backward compatibility with existing functions

### Global State (`src/hooks/useNodesStore.js`)
- `aiProvider`: Current selected provider
- `aiModel`: Current selected model
- `setAIProviderAndModel()`: Update both provider and model

### UI Components
- **Sidebar**: Provider/model selection with idea buffet generation
- **NodeToolbarAdd**: Provider/model selection in AI generation modal
- **CustomNode**: Uses global provider/model for AI thought generation

## Future Enhancements

- Model-specific parameter tuning (temperature, max tokens)
- Provider-specific features (e.g., vision models for file analysis)
- Usage tracking and cost optimization
- Custom model configurations
- Batch processing with different providers

## Power User Features

For users who want more control:
- Switch between providers for different use cases
- Use faster models (Groq) for quick iterations
- Use more capable models (GPT-4o) for complex reasoning
- Access free models through OpenRouter for cost savings 