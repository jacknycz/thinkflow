// src/components/Canvas.jsx
import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useNodesStore } from '../hooks/useNodesStore';
import CustomNodeWrapper from './CustomNodeWrapper';

const nodeTypes = {
  custom: CustomNodeWrapper,
};

const edgeTypes = {};

export default function Canvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    removeIdeaFromBuffet,
  } = useNodesStore();

  const onNodesChange = (changes) => {
    console.log('🧼 applying node changes:', changes);
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes) => {
    console.log('🔗 applying edge changes:', changes);
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const ideaData = event.dataTransfer.getData('application/json');
    if (!ideaData) return;

    const idea = JSON.parse(ideaData);
    const bounds = event.currentTarget.getBoundingClientRect();
    const dropPosition = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    const distances = nodes.map((node) => {
      const dx = node.position.x - dropPosition.x;
      const dy = node.position.y - dropPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { id: node.id, distance };
    });

    const nearest = distances.reduce((a, b) => (a.distance < b.distance ? a : b), distances[0]);
    const parentId = nearest?.id || 'root';

    // Check if parent is root and enforce limit of 5 children
    if (parentId === 'root') {
      const rootChildren = nodes.filter((node) => node.data.parentId === 'root');
      if (rootChildren.length >= 5) {
        console.warn('Limit of 5 first-level children reached.');
        return;
      }

      // Assign background color based on the number of root children
      const colors = ['#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9'];
      const colorIndex = rootChildren.length % colors.length;
      idea.backgroundColor = colors[colorIndex];
    }

    console.log('📦 Adding node with data:', {
      title: idea.title,
      summary: idea.summary,
      backgroundColor: idea.backgroundColor,
    });
    

    // Add node at drop position
    addNode(parentId, idea.title, idea.summary, dropPosition, { backgroundColor: idea.backgroundColor });

    // Remove idea from sidebar buffet
    removeIdeaFromBuffet(idea.title);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const getNodeStyle = (node) => {
    return node.data.backgroundColor
      ? { backgroundColor: node.data.backgroundColor }
      : {};
  };
  

  console.log('🎨 Rendering nodes:', nodes);

  return (
    <div className="flex-1 h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
      <ReactFlow
        nodes={nodes.map((node) => ({ ...node, style: getNodeStyle(node) }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType="bezier"
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            The canvas is empty. Start by entering a topic in the topbar.
          </div>
        )}
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
