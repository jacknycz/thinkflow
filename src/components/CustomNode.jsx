import React, { useState, useEffect } from 'react';
import { IconButton, Modal, TextArea, TextInput, Button } from 'pres-start-core';
import { Handle, Position, useReactFlow } from 'reactflow';
import { generateSingleIdea } from '../utils/openai';
import { useNodesStore } from '../hooks/useNodesStore';
import DeleteIcon from '@mui/icons-material/Delete';
import NodeToolbar from './NodeToolbar';

// icons
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NoteAltIcon from '@mui/icons-material/NoteAlt';

export default function CustomNode({ id, data, addNode, updateNode = () => {}, nodes }) {
  const [hovered, setHovered] = useState(false);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState('idea');

  const reactFlowInstance = useReactFlow();

  const [noteText, setNoteText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const deleteNode = useNodesStore((state) => state.deleteNode);
  const hoveredNodeId = useNodesStore((state) => state.hoveredNodeId);
  const setHoveredNode = useNodesStore((state) => state.setHoveredNode);
  const clearHoveredNode = useNodesStore((state) => state.clearHoveredNode);
  const draggedNodeId = useNodesStore((state) => state.draggedNodeId);
  const setDraggedNode = useNodesStore((state) => state.setDraggedNode);
  const clearDraggedNode = useNodesStore((state) => state.clearDraggedNode);
  const pinnedNodeId = useNodesStore((state) => state.pinnedNodeId);
  const pinnedNodeIds = useNodesStore((state) => state.pinnedNodeIds);

  useEffect(() => {
    setNoteText(data.note || '');
    setSummaryText(data.summary || '');
  }, [data.note, data.summary]);

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

  // add node from the node button
  const handleAdd = () => {
    setNewTitle('');
    setNewSummary('');
    setAddModalOpen(true);
  };

  // "confirm" the add node
  const handleConfirmAdd = () => {
    const label = newTitle.trim();
    const summary = newSummary.trim();
    if (label) {
      const fullLabel = label + (summary ? `\n${summary}` : '');
      
      const currentTime = Date.now();
      const randomOffset = Math.sin(currentTime) * 50;
      
      const offset = 160;
      const newPosition = {
        x: reactFlowInstance.getNode(id).position.x + offset + randomOffset,
        y: reactFlowInstance.getNode(id).position.y + offset + randomOffset,
      };
      
      const dx = newPosition.x - reactFlowInstance.getNode(id).position.x;
      const dy = newPosition.y - reactFlowInstance.getNode(id).position.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      let sourceHandle = 'right-source';
      let targetHandle = 'left-target';
      
      if (absDx > absDy) {
        sourceHandle = dx > 0 ? 'right-source' : 'left-source';
        targetHandle = dx > 0 ? 'left-target' : 'right-target';
      } else {
        sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
        targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
      }
      
      addNode(id, label, summary, newPosition, {
        sourceHandle,
        targetHandle,
        parentId: id
      });
    }
    setAddModalOpen(false);
  };

  // NEW: handle Generate AI modal confirmed generate
  const handleGenerateAIConfirm = async () => {
    setGenerateModalOpen(false);
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    try {
      const rootNode = nodes.find(n => n.id === 'root')?.data?.label || '';
      const parentNodes = [];
      let parentId = data.parentId;
      while (parentId && parentId !== 'root') {
        const parent = nodes.find(n => n.id === parentId);
        if (parent) {
          parentNodes.unshift(parent.data?.label || '');
          parentId = parent.data?.parentId;
        } else {
          break;
        }
      }
      const currentNode = data.label || '';

      const ideaText = await generateSingleIdea({
        rootNode,
        parentNodes,
        currentNode,
        promptType: selectedPromptType,
      });

      if (ideaText && typeof ideaText === 'string') {
        const currentNodeObj = reactFlowInstance.getNode(id);
        const offset = 160;
        const currentTime = Date.now();
        const randomOffset = Math.sin(currentTime) * 50;
        const newPosition = {
          x: currentNodeObj.position.x + offset + randomOffset,
          y: currentNodeObj.position.y + offset + randomOffset,
        };
        const dx = newPosition.x - currentNodeObj.position.x;
        const dy = newPosition.y - currentNodeObj.position.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let sourceHandle = 'right-source';
        let targetHandle = 'left-target';
        if (absDx > absDy) {
          sourceHandle = dx > 0 ? 'right-source' : 'left-source';
          targetHandle = dx > 0 ? 'left-target' : 'right-target';
        } else {
          sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
          targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
        }
        addNode(id, ideaText, '', newPosition, {
          sourceHandle,
          targetHandle,
          parentId: id,
        });
      } else {
        console.error('Failed to generate AI idea:', ideaText);
      }
    } catch (error) {
      console.error('Error generating AI idea:', error);
    } finally {
      window.dispatchEvent(new CustomEvent('ai-thinking-end'));
    }
  };

  // save/handle the note on node feature
  const handleSaveNote = () => {
    updateNode(id, {
      note: noteText,
      summary: summaryText,
    });
    setNoteModalOpen(false);
  };

  const handleDeleteNode = () => {
    if (id === 'root') {
      console.warn('Cannot delete the root node.');
      return;
    }
    deleteNode(id);
  };

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

  return (
    <div
      className={`group relative p-6 border rounded-3xl shadow max-w-96 transition-all duration-300 ${
        shouldBlur ? 'node-blur' : isPinned ? 'node-focus' : ''
      }`}
      style={{ 
        background: `radial-gradient(circle, transparent 30%, ${data.nodeColor || '#e5e7eb'}40 100%)`,
        border: `2px solid ${data.nodeColor || '#e5e7eb'}`,
        // borderRadius: '24px',
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
      {/* Toolbar for child nodes */}
      <NodeToolbar nodeId={id} isPinned={isPinned} />
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      <h3 className="font-normal leading-tight line-clamp-2 whitespace-pre-wrap" style={{ color: data.nodeColor || '#374151' }}>{title}</h3>
      {summary && (
        <p className={`whitespace-pre-wrap font-light text-sm mt-1 transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`} style={{ color: data.nodeColor || '#6b7280' }}>
          {summary}
        </p>
      )}
      {/* {!summary && id !== 'root' && (
        <p className="text-red-500 text-xs">NO SUMMARY for child node</p>
      )} */}

      {hovered && (
        <div className="absolute top-0 right-0 px-4 space-y-1 transform translate-x-full flex flex-col gap-2">
          <IconButton
            size="sm"
            variant="primary"
            shape="circle"
            title="Add idea"
            onClick={handleAdd}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="sm"
            variant="primary"
            shape="circle"
            title="Generate AI Idea"
            onClick={() => setGenerateModalOpen(true)}
          >
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="sm"
            variant="primary"
            shape="circle"
            title="View note"
            onClick={() => setNoteModalOpen(true)}
          >
            <InfoIcon fontSize="small" />
          </IconButton>

          {id !== 'root' && (
            <IconButton
              size="sm"
              variant="primary"
              shape="circle"
              title="Delete Node"
              onClick={handleDeleteNode}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}

          <IconButton
            size="sm"
            variant="primary"
            shape="circle"
            title="Edit Note"
            onClick={() => setNoteModalOpen(true)}
          >
            <NoteAltIcon fontSize="small" />
          </IconButton>
        </div>
      )}

      {data.note && (
        <div className="mt-4 p-2 bg-yellow-50 rounded text-sm text-gray-600 whitespace-pre-wrap">
          {data.note}
        </div>
      )}

      {/* Add Idea Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Idea">
        <div className="space-y-4">
          <TextInput
            label="Title"
            placeholder="New idea title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextArea
            label="Summary"
            placeholder="Optional summary"
            rows={2}
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setAddModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmAdd}>
            Add Idea
          </Button>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} title="Add/Edit Note">
        <div className="space-y-4">
          <TextArea
            label="Note"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter your note..."
            rows={4}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setNoteModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNote}>
            Save Note
          </Button>
        </div>
      </Modal>

      {/* NEW: Generate AI Type Modal */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate AI Response">
        <div className="space-y-4">
          <p className="font-semibold">As...</p>
          <div className="flex flex-col space-y-2">
            {['question', 'idea', 'task', 'note'].map((type) => (
              <label key={type} className="inline-flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="promptType"
                  value={type}
                  checked={selectedPromptType === type}
                  onChange={() => setSelectedPromptType(type)}
                  className="form-radio text-blue-600"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setGenerateModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerateAIConfirm}>
            Generate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
