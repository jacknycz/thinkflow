import React, { useRef, useState } from 'react';
import { useNodesStore } from '../hooks/useNodesStore';
import { IconButton, Tooltip, Modal, Button, TextInput, TextArea } from 'pres-start-core';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NoteAltIcon from '@mui/icons-material/NoteAlt';

export default function NodeItem({ node }) {
  const nodeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaSummary, setNewIdeaSummary] = useState('');
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState(node.note || '');

  const updateNode = useNodesStore((state) => state.updateNode);
  const generateAIChild = useNodesStore((state) => state.generateAIChild);
  const addNode = useNodesStore((state) => state.addNode);

  // Helpers to split label into title and summary
  const getLabelTitle = (label) => {
    if (typeof label !== 'string') return '';
    return label.split('\n')[0].trim();
  };

  const getLabelSummary = (label) => {
    if (typeof label !== 'string') return '';
    const parts = label.split('\n');
    return parts.length > 1 ? parts.slice(1).join('\n').trim() : '';
  };

  const labelTitle = getLabelTitle(node.label);
  const labelSummary = getLabelSummary(node.label);

  // Extract summary from first idea if it follows the same pattern
  const getSummaryFromIdea = (idea) => {
    if (typeof idea !== 'string') return '';
    const parts = idea.split('\n');
    return parts.length > 1 ? parts.slice(1).join('\n').trim() : '';
  };
  const nodeSummary = node.ideas && node.ideas.length > 0 ? getSummaryFromIdea(node.ideas[0]) : '';

  const handleAddCustomIdea = () => {
    setModalOpen(true);
  };

  const handleSaveIdea = () => {
    if (newIdeaTitle.trim() !== '') {
      const idea = newIdeaSummary.trim()
        ? `${newIdeaTitle.trim()}\n${newIdeaSummary.trim()}`
        : newIdeaTitle.trim();
      addNode(node.id, idea);
      setModalOpen(false);
      setNewIdeaTitle('');
      setNewIdeaSummary('');
    }
  };

  const handleSaveNote = () => {
    updateNode(node.id, { note: noteText });
    setNoteModalOpen(false);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = node.position.x;
    const initialY = node.position.y;

    const handleMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      updateNode(node.id, {
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
    <>
      <div
        ref={nodeRef}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`absolute bg-white rounded shadow p-3 w-64 max-w-full cursor-move transition-transform duration-100 ${
          dragging ? 'scale-105' : ''
        }`}
        style={{
          left: node.position?.x || 0,
          top: node.position?.y || 0,
        }}
        title={`Node: ${labelTitle}`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 mb-2 truncate flex-1">{labelTitle}</h3>

          {hovered && (
            <div className="flex gap-1">
              <Tooltip content="Generate AI Idea" placement="top">
                <IconButton
                  icon={<AutoAwesomeIcon />}
                  size="sm"
                  title="Generate AI Idea"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateAIChild(node.id, labelTitle);
                  }}
                />
              </Tooltip>

              <Tooltip content="Add your own idea" placement="top">
                <IconButton
                  icon={<AddCircleOutlineIcon />}
                  size="sm"
                  title="Add your own idea"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddCustomIdea();
                  }}
                />
              </Tooltip>

              {labelSummary && (
                <Tooltip content={labelSummary} placement="top">
                  <IconButton
                    icon={<InfoOutlinedIcon />}
                    size="sm"
                    title="Node Summary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              )}

              <Tooltip content="Add/Edit Note" placement="top">
                <IconButton
                  icon={<NoteAltIcon />}
                  size="sm"
                  title="Add/Edit Note"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteModalOpen(true);
                  }}
                />
              </Tooltip>
            </div>
          )}
        </div>

        {/* Show label summary if present */}
        {labelSummary && (
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{labelSummary}</p>
        )}

        {/* Show note if present */}
        {node.note && (
          <div className="mt-2 p-2 bg-yellow-50 rounded-md shadow">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{node.note}</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Your Idea">
        <div className="space-y-4">
          <TextInput
            label="Idea Title"
            value={newIdeaTitle}
            onChange={(e) => setNewIdeaTitle(e.target.value)}
            placeholder="Enter your idea title"
          />
          <textarea
            label="Idea Summary"
            value={newIdeaSummary}
            onChange={(e) => setNewIdeaSummary(e.target.value)}
            placeholder="Enter your idea summary"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveIdea} disabled={!newIdeaTitle.trim()}>
            Save
          </Button>
        </div>
      </Modal>

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
    </>
  );
}
