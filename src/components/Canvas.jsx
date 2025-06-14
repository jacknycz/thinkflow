// src/components/Canvas.jsx
import React, { useRef } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';
import NodeItem from './NodeItem';
import Connections from './Connections';

export default function Canvas() {
  const containerRef = useRef(null);
  const nodes = useNodesStore((state) => state.nodes);
  const updateNode = useNodesStore((state) => state.updateNode);

  const layoutTree = () => {
    const levelMap = {};
    const positions = {};

    const placeNode = (id, depth = 0, index = 0) => {
      if (!levelMap[depth]) levelMap[depth] = 0;
      const x = 200 + depth * 280;
      const y = 100 + levelMap[depth] * 150;
      levelMap[depth]++;
      positions[id] = { x, y };
      const node = nodes.find((n) => n.id === id);
      if (node && node.children) {
        node.children.forEach((childId, i) => placeNode(childId, depth + 1, i));
      }
    };

    placeNode('root');
    Object.entries(positions).forEach(([id, pos]) => updateNode(id, { position: pos }));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-auto bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <Connections nodes={nodes} />
      </svg>

      {nodes.map((node) => (
        <NodeItem key={node.id} node={node} />
      ))}

      {/* Floating layout tools */}
      <div className="absolute top-4 right-4 z-50 space-x-2">
        <button
          onClick={layoutTree}
          className="bg-white text-gray-800 px-3 py-1 rounded shadow hover:bg-gray-100"
        >
          🧼 Tidy Layout
        </button>
      </div>
    </div>
  );
}

export { Canvas };
