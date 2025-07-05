// src/components/Canvas.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  // getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useNodesStore } from '../hooks/useNodesStore';
import CustomNodeWrapper from './CustomNodeWrapper';
import { fetchBackgroundImage } from '../utils/unsplash';

// Custom edge component with neon glow
const NeonEdge = ({ id, source, target, sourceHandle, targetHandle, style, data }) => {
  const nodes = useNodesStore((state) => state.nodes);
  
  // Find the source node to get its background color
  const sourceNode = nodes.find(n => n.id === source);
  const edgeColor = sourceNode?.data?.backgroundColor || '#ffffff';
  
  // Create neon glow effect
  const neonStyle = {
    ...style,
    stroke: edgeColor,
    strokeWidth: 3,
    filter: `drop-shadow(0 0 8px ${edgeColor}) drop-shadow(0 0 16px ${edgeColor})`,
  };

  return (
    <path
      style={neonStyle}
      markerEnd="url(#arrowhead-neon)"
    />
  );
};

export default function Canvas() {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const reactFlowRef = useRef(null);

  // Memoize nodeTypes and edgeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(() => ({
    custom: CustomNodeWrapper,
  }), []);

  const edgeTypes = useMemo(() => ({
    neon: NeonEdge,
  }), []);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    removeIdeaFromBuffet,
  } = useNodesStore();

  // Get pin state for edge blurring
  const pinnedNodeId = useNodesStore((state) => state.pinnedNodeId);
  const pinnedNodeIds = useNodesStore((state) => state.pinnedNodeIds);
  const draggedNodeId = useNodesStore((state) => state.draggedNodeId);

  // Get root node
  const rootNode = nodes.find(n => n.id === 'root');

  // Timer effect for AI thinking
  useEffect(() => {
    let interval;
    if (isAIThinking) {
      interval = setInterval(() => {
        setThinkingTime(prev => prev + 0.01);
      }, 10); // Update every 10ms for hundredths of seconds
    } else {
      setThinkingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAIThinking]);

  // Listen for AI thinking state changes
  useEffect(() => {
    // This will be triggered when AI generation starts/stops
    // You can add a global state or event system to track this
    const handleAIStart = () => setIsAIThinking(true);
    const handleAIEnd = () => setIsAIThinking(false);

    // For now, we'll simulate this with a global event
    window.addEventListener('ai-thinking-start', handleAIStart);
    window.addEventListener('ai-thinking-end', handleAIEnd);

    return () => {
      window.removeEventListener('ai-thinking-start', handleAIStart);
      window.removeEventListener('ai-thinking-end', handleAIEnd);
    };
  }, []);

  // Fetch background image when root node topic changes
  useEffect(() => {
    if (rootNode?.data?.label) {
      setIsLoadingImage(true);
      fetchBackgroundImage(rootNode.data.label)
        .then((imageData) => {
          setBackgroundImage(imageData);
          setIsLoadingImage(false);
        })
        .catch((error) => {
          console.error('Failed to fetch background image:', error);
          setIsLoadingImage(false);
        });
    } else {
      setBackgroundImage(null);
    }
  }, [rootNode?.data?.label]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const onNodesChange = (changes) => {
    // console.log('🧼 applying node changes:', changes);
    setNodes((nds) => applyNodeChanges(changes, nds));

    // Check if any nodes are being dragged and update handles in real-time
    changes.forEach(change => {
      if (change.type === 'position') {
        // Update handles during drag (not just after)
        checkAndUpdateHandles(change.id);
      }
    });
  };

  const onNodeDragStart = (event, node) => {
    console.log('🚀 Node drag started:', node.id);
    const { setDraggedNode } = useNodesStore.getState();
    setDraggedNode(node.id);
  };

  const onNodeDragStop = (event, node) => {
    console.log('🛑 Node drag stopped:', node.id);
    const { clearDraggedNode } = useNodesStore.getState();
    clearDraggedNode();
  };

  const checkAndUpdateHandles = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || nodeId === 'root' || !node.data.parentId) return;

    const parentNode = nodes.find(n => n.id === node.data.parentId);
    if (!parentNode) return;

    // Calculate which handles should be used based on current positions
    const dx = node.position.x - parentNode.position.x;
    const dy = node.position.y - parentNode.position.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let optimalSourceHandle = 'right-source';
    let optimalTargetHandle = 'left-target';

    // Determine optimal source handle on parent
    if (absDx > absDy) {
      optimalSourceHandle = dx > 0 ? 'right-source' : 'left-source';
      optimalTargetHandle = dx > 0 ? 'left-target' : 'right-target';
    } else {
      optimalSourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
      optimalTargetHandle = dy > 0 ? 'top-target' : 'bottom-target';
    }

    // Check if current handles are optimal
    const currentSourceHandle = node.data.sourceHandle || 'right-source';
    const currentTargetHandle = node.data.targetHandle || 'left-target';

    if (optimalSourceHandle !== currentSourceHandle || optimalTargetHandle !== currentTargetHandle) {
      // console.log('Updating handles during drag:', {
      //   nodeId,
      //   from: { source: currentSourceHandle, target: currentTargetHandle },
      //   to: { source: optimalSourceHandle, target: optimalTargetHandle }
      // });

      // Update the node with new handles
      const updateNode = useNodesStore.getState().updateNode;
      updateNode(nodeId, {
        sourceHandle: optimalSourceHandle,
        targetHandle: optimalTargetHandle
      });
    }
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
    console.log('💡 Dropped idea:', idea);

    // Get the ReactFlow container bounds
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    
    // Calculate the drop position in screen coordinates
    const screenPosition = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    // Convert screen coordinates to flow coordinates using the ref
    let dropPosition = screenPosition;
    if (reactFlowRef.current) {
      try {
        dropPosition = reactFlowRef.current.screenToFlowPosition(screenPosition);
      } catch (error) {
        console.warn('Could not convert coordinates, using screen position:', error);
      }
    }

    console.log('📍 Screen position:', screenPosition);
    console.log('📍 Drop position (flow coordinates):', dropPosition);

    // Find root node and calculate distance to it
    const rootNode = nodes.find(n => n.id === 'root');
    const isNearRoot = rootNode ? (() => {
      const dx = rootNode.position.x - dropPosition.x;
      const dy = rootNode.position.y - dropPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 100; // Consider drops within 100px of root as root drops
    })() : false;

    const distances = nodes.map((node) => {
      const dx = node.position.x - dropPosition.x;
      const dy = node.position.y - dropPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { id: node.id, distance };
    });

    // Sort distances to find the actual closest node
    distances.sort((a, b) => a.distance - b.distance);
    console.log('📏 Node distances:', distances);

    // If dropping near root or no nodes exist, use root as parent
    const nearest = isNearRoot || distances.length === 0
      ? { id: 'root' }
      : distances[0]; // Use the closest node (first after sorting)
    const parentId = nearest?.id || 'root';

    console.log('🎯 Nearest node:', nearest, 'Parent ID:', parentId);

    // Check if parent is root and enforce limit of 5 children
    if (parentId === 'root') {
      const rootChildren = nodes.filter((node) => node.data?.parentId === 'root');
      if (rootChildren.length >= 5) {
        console.warn('Limit of 5 first-level children reached.');
        return;
      }
    }

    // Get parent node to inherit node color
    const parentNode = nodes.find(n => n.id === parentId);
    let nodeColor = '';

    if (parentId === 'root') {
      const rootChildren = nodes.filter((node) => node.data?.parentId === 'root');
      const colors = ['#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9'];
      nodeColor = colors[rootChildren.length % colors.length];
    } else if (parentNode) {
      nodeColor = parentNode.data?.nodeColor || '';
    }

    // Calculate the best handle position for root node connections
    let targetHandle = 'left-target';
    let sourceHandle = 'right-source';
    if (parentId === 'root' && rootNode) {
      const dx = dropPosition.x - rootNode.position.x;
      const dy = dropPosition.y - rootNode.position.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        sourceHandle = dx > 0 ? 'right-source' : 'left-source';
      } else {
        sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
      }
    } else if (parentNode) {
      // Calculate closest handles for non-root connections
      const dx = dropPosition.x - parentNode.position.x;
      const dy = dropPosition.y - parentNode.position.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Determine source handle on parent
      if (absDx > absDy) {
        sourceHandle = dx > 0 ? 'right-source' : 'left-source';
      } else {
        sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
      }

      // Determine target handle on new node (opposite side)
      switch (sourceHandle) {
        case 'right-source':
          targetHandle = 'left-target';
          break;
        case 'left-source':
          targetHandle = 'right-target';
          break;
        case 'top-source':
          targetHandle = 'bottom-target';
          break;
        case 'bottom-source':
          targetHandle = 'top-target';
          break;
        default:
          targetHandle = 'left-target';
      }
    }

    console.log('📦 Adding node with data:', {
      title: idea.title,
      summary: idea.summary,
      nodeColor,
      parentId,
      sourceHandle,
      targetHandle,
      position: dropPosition
    });

    // Add node at drop position
    addNode(parentId, idea.title, idea.summary, dropPosition, {
      nodeColor,
      parentId,
      sourceHandle,
      targetHandle
    });

    // Remove idea from sidebar buffet
    removeIdeaFromBuffet(idea.title);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const getNodeStyle = (node) => {
    return node.data.backgroundColor
      ? { backgroundColor: node.data.backgroundColor, borderRadius: '24px' }
      : { borderRadius: '24px' };
  };

  // Apply neon styling to edges
  const styledEdges = useMemo(() => edges.map(edge => {
    const targetNode = nodes.find(n => n.id === edge.target);
    const sourceNode = nodes.find(n => n.id === edge.source);
    const edgeColor = targetNode?.data?.nodeColor || '#ffffff';

    // Determine if this edge should be blurred
    const shouldBlurEdge = (
      (pinnedNodeId && !pinnedNodeIds.includes(edge.source) && !pinnedNodeIds.includes(edge.target)) ||
      (draggedNodeId !== null && draggedNodeId !== edge.source && draggedNodeId !== edge.target)
    );

    return {
      ...edge,
      // type: edge.type || 'bezier', // Preserve the edge type
      style: {
        stroke: edgeColor,
        strokeWidth: 3,
        filter: shouldBlurEdge 
          ? `blur(2px) opacity(0.3) drop-shadow(0 0 4px ${edgeColor})`
          : `drop-shadow(0 0 8px ${edgeColor}) drop-shadow(0 0 16px ${edgeColor})`,
        transition: 'filter 0.3s ease-in-out',
      },
      markerEnd: {
        type: 'arrow',
        width: 20,
        height: 20,
        color: edgeColor,
        filter: shouldBlurEdge ? 'blur(2px) opacity(0.3)' : 'none',
      },
    };
  }), [edges, nodes, pinnedNodeId, pinnedNodeIds, draggedNodeId]);

  // console.log('🎨 Rendering nodes:', nodes);

  return (
    <div
      className="flex-1 h-full relative bg-thinkFlow-bg"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ backgroundColor: '#101828' }} // Add your desired color here
    >
      {/* Custom background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${backgroundImage.url})`,
            filter: 'blur(1px)'
          }}
        />
      )}

      {/* Loading overlay */}
      {isLoadingImage && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-gray-600">Loading background...</div>
        </div>
      )}

      {/* AI Thinking Timer */}
      {isAIThinking && (
        <div className="absolute top-4 left-4 z-30 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow-lg border">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-gray-700">AI Thinking</span>
            <span className="text-sm text-gray-500 font-mono">{formatTime(thinkingTime)}</span>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes.map((node) => ({ ...node, style: { ...getNodeStyle(node), background: 'var(--tw-bg-opacity,1) #232B3A', color: '#FFFFFF' } }))}
        edges={styledEdges.map((edge) => ({ ...edge, style: { ...edge.style, stroke: '#5B8DEF' } }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        nodeTypes={nodeTypes}
        // connectionLineType="bezier"
        className="relative z-20"
        ref={reactFlowRef}
        minZoom={0.1}
        maxZoom={4}
        // defaultZoom={1}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-30">
            The canvas is empty. Start by entering a topic in the topbar.
          </div>
        )}
        <Background />
        <Controls />
      </ReactFlow>

      {/* Photo credit */}
      {backgroundImage && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-30 bg-white bg-opacity-80 px-2 py-1 rounded">
          Photo by{' '}
          <a
            href={backgroundImage.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            {backgroundImage.photographer}
          </a>
          {' '}on{' '}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            Unsplash
          </a>
        </div>
      )}
    </div>
  );
}
