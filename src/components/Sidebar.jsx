// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';
import { generateIdea, generateIdeaBuffet, getAvailableProviders } from '../utils/aiProvider';
import { Button, TextInput, Tooltip, SelectInput } from 'pres-start-core';
import InfoIcon from '@mui/icons-material/Info';

export default function Sidebar() {
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const addNode = useNodesStore((state) => state.addNode);
  const removeIdeaFromBuffet = useNodesStore((state) => state.removeIdeaFromBuffet);
  const setIdeaBuffet = useNodesStore((state) => state.setIdeaBuffet);
  const ideaBuffet = useNodesStore((state) => state.ideaBuffet);
  const nodes = useNodesStore((state) => state.nodes);
  const rootNode = useNodesStore((state) => state.getRootNode());
  
  // AI Provider/Model selection from global state
  const aiProvider = useNodesStore((state) => state.aiProvider);
  const aiModel = useNodesStore((state) => state.aiModel);
  const setAIProviderAndModel = useNodesStore((state) => state.setAIProviderAndModel);

  // Get available providers and models
  const availableProviders = getAvailableProviders();
  const currentProvider = availableProviders.find(p => p.id === aiProvider);
  const currentModels = currentProvider?.models || [];

  const generateIdeas = async () => {
    const basePrompt = prompt.trim() || rootNode?.data?.label;
    if (!basePrompt) return;
    setChatLog((log) => [...log, { role: 'user', content: basePrompt }]);
    setPrompt('');
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    try {
      const ideas = await generateIdeaBuffet({ 
        userPrompt: basePrompt, 
        rootNode: rootNode?.data?.label || '', 
        numberOfIdeas: 5,
        provider: aiProvider,
        model: aiModel
      });
      // Map each idea string to an object with title and summary
      const ideaObjects = (ideas || []).map((idea) => ({ title: idea, summary: '' }));
      setIdeaBuffet(ideaObjects);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      window.dispatchEvent(new CustomEvent('ai-thinking-end'));
    }
  };

  const handleAddIdeaToNode = (nodeId, idea) => {
    const parentNode = nodes.find(n => n.id === nodeId);
    // Only pass nodeColor if the parent is not root
    const extraData = parentNode && parentNode.id !== 'root'
      ? { nodeColor: parentNode.data?.nodeColor }
      : {};
    addNode(nodeId, `${idea.title}`, idea.summary, null, extraData);
    removeIdeaFromBuffet(idea.title);
    setChatLog((log) => [...log, { role: 'system', content: `Idea added to ${idea.title}` }]);
  };

  const truncate = (text, maxLength = 20) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <aside className="w-80 p-4 bg-gradient-to-b from-gray-900 to-gray-800 h-full overflow-y-auto shadow-inner shadow-gray-900 border-l border-gray-700">
      <h2 className="text-lg font-bold mb-2 text-gray-100">
        Make some ideas
      </h2>

      {/* AI Provider/Model Selection */}
      <div className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            AI Provider
          </label>
          <SelectInput
            value={aiProvider}
            onChange={(e) => {
              const newProvider = e.target.value;
              const providerConfig = availableProviders.find(p => p.id === newProvider);
              const defaultModel = providerConfig?.models[0]?.id || 'gpt-4o';
              setAIProviderAndModel(newProvider, defaultModel);
            }}
            className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
          >
            {availableProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </SelectInput>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            AI Model
          </label>
          <SelectInput
            value={aiModel}
            onChange={(e) => setAIProviderAndModel(aiProvider, e.target.value)}
            className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
          >
            {currentModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded shadow-sm text-sm ${
              msg.role === 'user' 
                ? 'bg-gray-800 text-gray-200 border border-gray-600' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generateIdeas();
        }}
        className="flex gap-2 mb-6"
      >
        <TextInput
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            rootNode?.data?.label ? `Ex: ${rootNode.data.label.slice(0, 30)}...` : 'New idea topic...'
          }
          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button 
          variant="primary" 
          size="default"
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
        >
          Ask
        </Button>
      </form>

      <h3 className="text-md font-semibold mb-2 text-gray-100">🍽️ Idea Buffet</h3>
      {ideaBuffet.length === 0 && <p className="text-sm text-gray-400">No ideas yet — start chatting!</p>}

      <ul className="space-y-4">
        {ideaBuffet.map((idea, idx) => (
          <li
            key={`buffet-${idx}`}
            className="transition-all cursor-grab duration-300 border border-gray-600 hover:bg-gray-800 p-3 rounded-lg hover:shadow-lg hover:shadow-gray-900 text-sm bg-gray-800/50 backdrop-blur-sm"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(idea));
            }}
          >
            <p className="font-semibold text-gray-100 mb-1">{idea.title}</p>
            <p className="text-gray-300 mb-2 text-xs whitespace-pre-line break-words">
              {idea.summary}
            </p>
            <div className="flex flex-wrap gap-1 justify-end">
              {nodes.map((node) => (
                <Button
                  key={`${node.id}-${idx}`}
                  onClick={() => handleAddIdeaToNode(node.id, idea)}
                  variant="secondary"
                  size="small"
                  title={`Add to ${node.data?.label ?? 'Unnamed node'}`}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500 text-xs"
                >
                  {truncate(node.data?.label)}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { Sidebar };
