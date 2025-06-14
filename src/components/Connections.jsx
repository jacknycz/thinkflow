// src/components/Connections.jsx
import React from 'react';

export default function Connections({ nodes }) {
  const getNodeById = (id) => nodes.find((n) => n.id === id);

  const lines = nodes.flatMap((node) => {
    return node.children.map((childId) => {
      const child = getNodeById(childId);
      if (!child) return null;

      const x1 = node.position.x + 96; // center X of parent (approx)
      const y1 = node.position.y + 24; // center Y of parent (approx)
      const x2 = child.position.x + 96; // center X of child
      const y2 = child.position.y + 24; // center Y of child

      return (
        <line
          key={`${node.id}-${child.id}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="white"
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  });

  return (
    <>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="white" />
        </marker>
      </defs>
      {lines}
    </>
  );
}