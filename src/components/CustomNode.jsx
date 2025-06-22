import React, { useState, useEffect } from 'react';
import { IconButton, Modal, TextArea, TextInput, Button } from 'pres-start-core';
import { Handle, Position, useReactFlow } from 'reactflow';
import { generateIdea } from '../utils/openai';
import { useNodesStore } from '../hooks/useNodesStore';

// icons
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CustomNode({ id, data, addNode, updateNode = () => {}, nodes }) {
  const [hovered, setHovered] = useState(false);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const reactFlowInstance = useReactFlow();

  const [noteText, setNoteText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const deleteNode = useNodesStore((state) => state.deleteNode);

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
      
      // Calculate handle information for the new node
      const currentTime = Date.now();
      const randomOffset = Math.sin(currentTime) * 50; // Add some randomness to position
      
      // Calculate position relative to current node
      const offset = 160;
      const newPosition = {
        x: reactFlowInstance.getNode(id).position.x + offset + randomOffset,
        y: reactFlowInstance.getNode(id).position.y + offset + randomOffset,
      };
      
      // Calculate which handle to use based on position
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

  const handleGenerateAI = async () => {
    // Dispatch AI thinking start event
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    
    try {
      const idea = await generateIdea(data.label);
      if (idea?.title && idea?.summary) {
        const fullLabel = `${idea.title}\n${idea.summary}`;
        
        // Get current node position
        const currentNode = reactFlowInstance.getNode(id);
        if (!currentNode) {
          console.error('Could not find current node:', id);
          return;
        }
        
        console.log('Current node position:', currentNode.position);
        
        // Calculate handle information for the new node
        const currentTime = Date.now();
        const randomOffset = Math.sin(currentTime) * 50; // Add some randomness to position
        
        // Calculate position relative to current node
        const offset = 160;
        const newPosition = {
          x: currentNode.position.x + offset + randomOffset,
          y: currentNode.position.y + offset + randomOffset,
        };
        
        console.log('New node position:', newPosition);
        
        // Calculate which handle to use based on position
        const dx = newPosition.x - currentNode.position.x;
        const dy = newPosition.y - currentNode.position.y;
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
        
        console.log('Calculated handles:', { sourceHandle, targetHandle });
        
        addNode(id, idea.title, idea.summary, newPosition, {
          sourceHandle,
          targetHandle,
          parentId: id
        });
      } else {
        console.error('Failed to generate AI idea:', idea);
      }
    } catch (error) {
      console.error('Error generating AI idea:', error);
    } finally {
      // Dispatch AI thinking end event
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

  // break down the label from chat repsonse into title and summary
  const title = data.label?.split('\n')[0] || '';
  const summary = data.summary || data.label?.split('\n')[1] || '';

  // console.log(`🎯 Node buster ${id} data:`, data);

  // duh duh duh the node
  return (
    <div
      className="relative p-3 border rounded shadow w-64 transition-all duration-200"
      style={{ backgroundColor: data.backgroundColor || '#ffffff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Add handles on all sides for all nodes - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      <h3 className="font-bold text-gray-800 whitespace-pre-wrap">{title}</h3>
      <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>

      {/* UPDATE THIS: hover buttons, update to menu */}
      {hovered && (
        <div className="absolute top-2 right-2 flex gap-2">
          <IconButton
            size="sm"
            variant="solid"
            className="bg-blue-600 text-white hover:bg-blue-700"
            title="Add idea"
            onClick={handleAdd}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="sm"
            variant="solid"
            className="bg-green-600 text-white hover:bg-green-700"
            title="Generate AI Idea"
            onClick={handleGenerateAI}
          >
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="sm"
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
            title="View note"
            onClick={() => setNoteModalOpen(true)}
          >
            <InfoIcon fontSize="small" />
          </IconButton>

          {id !== 'root' && (
            <IconButton
              size="sm"
              variant="solid"
              className="bg-red-600 text-white hover:bg-red-700"
              title="Delete Node"
              onClick={handleDeleteNode}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}

          <IconButton
            size="sm"
            variant="solid"
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            title="Edit Note"
            onClick={() => setNoteModalOpen(true)}
          >
            <NoteAltIcon fontSize="small" />
          </IconButton>
        </div>
      )}

      {/* show the note guy */}
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
          {/* UPDATE THIS: summary test, do we want to add it back in?
          <TextArea
            label="Summary"
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Enter your summary..."
            rows={2}
          /> */}
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
    </div>
  );
}
