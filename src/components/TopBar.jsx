// src/components/TopBar.jsx
import React from 'react';
import { Button } from 'pres-start-core';
import { useNodesStore } from '../hooks/useNodesStore';

export const TopBar = () => {
  const label = useNodesStore((state) =>
    state.nodes.find((n) => n.id === 'root')?.label
  );
  const updateNode = useNodesStore((state) => state.updateNode);
  const generateAIChild = useNodesStore((state) => state.generateAIChild);

  const handleChange = (e) => {
    updateNode('root', { label: e.target.value });
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">🧠💦 ThinkFlow</h1>
      <input
        type="text"
        value={label || ''}
        onChange={handleChange}
        placeholder="Edit root topic..."
        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 w-1/2"
      />

      <Button onClick={() => generateAIChild('root')}>
        🤖 AI-Generate
      </Button>
    </header>
  );
};
