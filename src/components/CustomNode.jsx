import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useNodesStore } from '../hooks/useNodesStore';
import { useThemeStore } from '../hooks/useThemeStore';
import NodeMenu from './NodeMenu';

export default function CustomNode({ id, data, addNode, updateNode = () => {}, nodes }) {
  const [hovered, setHovered] = useState(false);

  const reactFlowInstance = useReactFlow();
  const hoveredNodeId = useNodesStore((state) => state.hoveredNodeId);
  const setHoveredNode = useNodesStore((state) => state.setHoveredNode);
  const clearHoveredNode = useNodesStore((state) => state.clearHoveredNode);
  const draggedNodeId = useNodesStore((state) => state.draggedNodeId);
  const pinnedNodeId = useNodesStore((state) => state.pinnedNodeId);
  const pinnedNodeIds = useNodesStore((state) => state.pinnedNodeIds);
  const activeRootId = useNodesStore((state) => state.activeRootId);

  // Theme store - subscribe to currentTheme to trigger re-renders
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const getThemeProperty = useThemeStore((state) => state.getThemeProperty);

  // Update connection when node position changes
  useEffect(() => {
    if (id === 'root' || data.parentId !== 'root') return;

    const rootNode = nodes.find(n => n.id === 'root');
    if (!rootNode) return;

    const node = reactFlowInstance.getNode(id);
    if (!node) return;

    const dx = node.position.x - rootNode.position.x;
    const dy = node.position.y - rootNode.position.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    let sourceHandle = 'right-source';
    if (absDx > absDy) {
      sourceHandle = dx > 0 ? 'right-source' : 'left-source';
    } else {
      sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
    }

    if (sourceHandle !== data.sourceHandle) {
      console.log('Updating handle to:', sourceHandle);
      updateNode(id, { sourceHandle });
    }
  }, [id, data.parentId, data.sourceHandle, nodes, reactFlowInstance, updateNode]);

  // Split label into title (first 2 lines) and summary (rest)
  const labelLines = data.label?.split('\n') || [];
  const title = labelLines.slice(0, 2).join('\n');
  const summary = labelLines.slice(2).join('\n');

  const isHovered = hoveredNodeId === id;
  const isDragged = draggedNodeId === id;
  const shouldBlur = (
    (pinnedNodeId && !pinnedNodeIds.includes(id)) ||
    (draggedNodeId !== null && draggedNodeId !== id)
  );
  const isPinned = pinnedNodeIds.includes(id);

  // Get theme properties
  const nodeTextClass = getThemeProperty('nodeText');
  const nodeTextSecondaryClass = getThemeProperty('nodeTextSecondary');
  const nodeBackgroundClass = getThemeProperty('nodeBackground');
  const nodeBorderClass = getThemeProperty('nodeBorder');
  const noteBackgroundClass = getThemeProperty('noteBackground');
  const noteTextClass = getThemeProperty('noteText');

  console.log(`🎨 Node ${id} theme classes:`, {
    nodeText: nodeTextClass,
    nodeTextSecondary: nodeTextSecondaryClass,
    nodeBackground: nodeBackgroundClass,
    nodeBorder: nodeBorderClass,
    noteBackground: noteBackgroundClass,
    noteText: noteTextClass,
    currentTheme
  });

  return (
    <div
      className={`group relative p-4 border rounded-3xl shadow max-w-96 transition-all duration-300 ${
        shouldBlur ? 'node-blur' : isPinned ? 'node-focus' : ''
      } ${id === activeRootId ? 'node-root' : ''} ${nodeBackgroundClass} ${nodeBorderClass}`}
      style={{ 
        background: `radial-gradient(circle, transparent 30%, ${data.nodeColor || '#e5e7eb'}40 100%)`,
        border: `2px solid ${data.nodeColor || '#e5e7eb'}`,
      }}
      onMouseEnter={() => {
        setHovered(true);
        setHoveredNode(id);
      }}
      onMouseLeave={() => {
        setHovered(false);
        clearHoveredNode();
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      {/* Unified Node Menu */}
      <NodeMenu 
        nodeId={id} 
        data={data} 
        addNode={addNode} 
        updateNode={updateNode} 
        nodes={nodes} 
        isPinned={isPinned}
      />

      <h3 className={`font-normal leading-tight line-clamp-2 whitespace-pre-wrap ${nodeTextClass}`} style={{ color: data.nodeColor || '#374151' }}>{title}</h3>
      {summary && (
        <p className={`whitespace-pre-wrap font-light text-sm mt-1 transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        } ${nodeTextSecondaryClass}`} style={{ color: data.nodeColor || '#6b7280' }}>
          {summary}
        </p>
      )}

      {data.note && (
        <div className={`mt-4 p-2 rounded text-sm whitespace-pre-wrap ${noteBackgroundClass} ${noteTextClass}`}>
          {data.note}
        </div>
      )}
    </div>
  );
}
