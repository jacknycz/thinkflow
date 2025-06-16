// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';
import { generateIdea } from '../utils/openai';
import { Button, TextInput, Tooltip } from 'pres-start-core';
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

  const generateIdeas = async () => {
    const basePrompt = prompt.trim() || rootNode?.data?.label;
    if (!basePrompt) return;

    setChatLog((log) => [...log, { role: 'user', content: basePrompt }]);
    setPrompt('');

    const generated = await Promise.all([
      generateIdea(basePrompt),
      generateIdea(basePrompt),
      generateIdea(basePrompt),
    ]);

    const uniqueIdeas = generated.filter(Boolean);
    setIdeaBuffet(uniqueIdeas);
  };

  const handleAddIdeaToNode = (nodeId, idea) => {
    addNode(nodeId, `${idea.title}`, idea.summary);
    removeIdeaFromBuffet(idea.title);
    setChatLog((log) => [...log, { role: 'system', content: `Idea added to ${idea.title}` }]);
  };

  const truncate = (text, maxLength = 20) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <aside className="w-80 p-4 bg-gray-50 h-full overflow-y-auto shadow-inner shadow-md">
      <h2 className="text-lg font-bold mb-2">
        💬 Think Chat{' '}
        <Tooltip content="Use this area to drill down into your topic" className="w-60" position="bottom">
          <InfoIcon />
        </Tooltip>
      </h2>

      <div className="space-y-2 mb-4">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded shadow-sm text-sm ${msg.role === 'user' ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-600'}`}
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
        />
        <Button variant="primary" size="default">
          Ask
        </Button>
      </form>

      <h3 className="text-md font-semibold mb-2">🍽️ Idea Buffet</h3>
      {ideaBuffet.length === 0 && <p className="text-sm text-gray-500">No ideas yet — start chatting!</p>}

      <ul className="space-y-4">
        {ideaBuffet.map((idea, idx) => (
          <li
            key={`buffet-${idx}`}
            className="transition-all duration-300 border border-gray-200 hover:bg-white p-2 rounded-lg hover:shadow text-sm"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(idea));
            }}
          >
            <p className="font-semibold text-gray-800 mb-1">{idea.title}</p>
            <p className="text-gray-600 mb-2 text-xs whitespace-pre-line break-words">
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
