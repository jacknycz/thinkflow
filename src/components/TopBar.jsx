// src/components/TopBar.jsx
import React from 'react';
import { Button, TextInput } from 'pres-start-core';
import { useNodesStore } from '../hooks/useNodesStore';


export const TopBar = () => {
  const rootNode = useNodesStore((state) => Array.isArray(state.nodes) ? state.nodes.find((n) => n.id === 'root') : null);

  const updateNode = useNodesStore((state) => state.updateNode);
  const generateAIChild = useNodesStore((state) => state.generateAIChild);
  const addNode = useNodesStore((state) => state.addNode);

  if (!updateNode || typeof updateNode !== 'function') {
    console.error('updateNode is not defined or not a function. Check useNodesStore implementation.');
    console.log('useNodesStore state:', useNodesStore((state) => state));
  }

  const handleChange = (e) => {
    const newLabel = e.target.value;
    if (newLabel.trim() !== '' && !rootNode) {
      addNode('root', newLabel);
    } else if (rootNode) {
      updateNode('root', { label: newLabel });
    }
  };

  return (
    <header className="bg-white gray-800 shadow-sm p-4 flex justify-between items-center gap-4 top-0 left-0 right-0 z-10">
      <h1 className="text-2xl font-bold">🧠💦 ThinkFlow</h1>
      <TextInput
        type="text"
        value={rootNode?.data?.label || ''}
        onChange={handleChange}
        placeholder="Get started with your idea..."
      />
    </header>
  );
};
