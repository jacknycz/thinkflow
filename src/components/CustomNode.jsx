import React, { useState, useEffect } from 'react';
import { IconButton, Modal, TextArea, TextInput, Button } from 'pres-start-core';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import { Handle, Position } from 'reactflow';
import { generateIdea } from '../utils/openai';
import { useNodesStore } from '../hooks/useNodesStore';

export default function CustomNode({ id, data, addNode, updateNode = () => {} }) {
  const [hovered, setHovered] = useState(false);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const deleteNode = useNodesStore((state) => state.deleteNode);

  useEffect(() => {
    setNoteText(data.note || '');
    setSummaryText(data.summary || '');
  }, [data.note, data.summary]);

  const handleAdd = () => {
    setNewTitle('');
    setNewSummary('');
    setAddModalOpen(true);
  };

  const handleConfirmAdd = () => {
    const label = newTitle.trim();
    const summary = newSummary.trim();
    if (label) {
      const fullLabel = label + (summary ? `\n${summary}` : '');
      addNode(id, fullLabel);
    }
    setAddModalOpen(false);
  };

  const handleGenerateAI = async () => {
    const idea = await generateIdea(data.label);
    if (idea?.title && idea?.summary) {
      const fullLabel = `${idea.title}\n${idea.summary}`;
      addNode(id, fullLabel);
    } else {
      console.error('Failed to generate AI idea:', idea);
    }
  };

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

  const title = data.label?.split('\n')[0] || '';
  const summary = data.summary || data.label?.split('\n')[1] || '';

  console.log(`🎯 Node buster ${id} data:`, data);


  return (
    <div
    className="relative p-3 border rounded shadow w-64 transition-all duration-200"
    style={{ backgroundColor: data.backgroundColor || '#ffffff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <h3 className="font-bold text-gray-800 whitespace-pre-wrap">{title}</h3>
      <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>

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

          <IconButton
            size="sm"
            variant="solid"
            className="bg-red-600 text-white hover:bg-red-700"
            title="Delete Node"
            onClick={handleDeleteNode}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>

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
          <TextArea
            label="Summary"
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Enter your summary..."
            rows={2}
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
    </div>
  );
}
