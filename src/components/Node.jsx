// src/components/Node.jsx
import React, { useRef, useState } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';

export default function Node({ id, label, position }) {
  const nodeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const updateNode = useNodesStore((state) => state.updateNode);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = position.x;
    const initialY = position.y;

    const handleMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      updateNode(id, {
        position: {
          x: initialX + dx,
          y: initialY + dy,
        },
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={nodeRef}
      onMouseDown={handleMouseDown}
      className={`absolute px-4 py-2 rounded-xl max-w-60 bg-white shadow-md text-sm cursor-move transition-transform duration-100 ${
        dragging ? 'scale-105' : ''
      }`}
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
      </div>
    </div>
  );
}
