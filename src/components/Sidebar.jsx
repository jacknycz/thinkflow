// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';
import { generateIdea } from '../utils/openai'; // switched to OpenRouter with title/summary

export default function Sidebar() {
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [ideaBuffet, setIdeaBuffet] = useState([]);
  const addNode = useNodesStore((state) => state.addNode);
  const nodes = useNodesStore((state) => state.nodes);

  const generateIdeas = async () => {
    if (!prompt.trim()) return;

    setChatLog((log) => [...log, { role: 'user', content: prompt }]);
    setPrompt('');

    const generated = await Promise.all([
      generateIdea(prompt),
      generateIdea(prompt),
      generateIdea(prompt),
    ]);

    const uniqueIdeas = generated.filter(Boolean);
    setIdeaBuffet(uniqueIdeas);
  };

  const handleAddIdeaToNode = (nodeId, idea) => {
    addNode(nodeId, `${idea.title}\n${idea.summary}`);
    setIdeaBuffet((ideas) => ideas.filter((i) => i.title !== idea.title));
    setChatLog((log) => [...log, { role: 'system', content: `Idea added to ${idea.title}` }]);
  };

  const truncate = (text, maxLength = 20) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <aside className="w-80 bg-gray-100 h-screen p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">💬 Think Chat</h2>

      <div className="space-y-2 mb-4">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded text-sm ${msg.role === 'user' ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-600'}`}
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
        className="flex gap-2 mb-4"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="New idea topic..."
          className="flex-1 border rounded p-2 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Ask
        </button>
      </form>

      <h3 className="text-md font-semibold mb-2">🍽️ Idea Buffet</h3>
      {ideaBuffet.length === 0 && <p className="text-sm text-gray-500">No ideas yet — start chatting!</p>}

      <ul className="space-y-2">
        {ideaBuffet.map((idea, idx) => (
          <li key={`buffet-${idx}`} className="bg-white p-2 rounded shadow text-sm">
            <p className="font-semibold text-gray-800 mb-1">{idea.title}</p>
            <p className="text-gray-600 mb-2 text-xs whitespace-pre-line break-words">{idea.summary}</p>
            <div className="flex flex-wrap gap-1 justify-end">
              {nodes.map((node) => (
                <button
                  key={`${node.id}-${idx}`}
                  onClick={() => handleAddIdeaToNode(node.id, idea)}
                  className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700"
                  title={`Add to ${node.label}`}
                >
                  ➕ {truncate(node.label)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { Sidebar };
