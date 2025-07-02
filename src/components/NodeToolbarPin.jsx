import React, { useState } from 'react';
import { IconButton, Tooltip, Modal, TextArea, Button } from 'pres-start-core';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { useNodesStore } from '../hooks/useNodesStore';
import { useThemeStore } from '../hooks/useThemeStore';

export default function NodeToolbarPin({ nodeId, isPinned, data, updateNode }) {
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const pinNode = useNodesStore(s => s.pinNode);
  const unpinNode = useNodesStore(s => s.unpinNode);
  const makeNodeRoot = useNodesStore(s => s.makeNodeRoot);
  
  // Theme store - subscribe to currentTheme to trigger re-renders
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const getThemeProperty = useThemeStore((state) => state.getThemeProperty);

  // Get theme properties
  const menuBackgroundClass = getThemeProperty('menuBackground');
  const menuBorderClass = getThemeProperty('menuBorder');
  const menuShadowClass = getThemeProperty('menuShadow');

  console.log(`🎨 NodeToolbarPin theme classes:`, {
    menuBackground: menuBackgroundClass,
    menuBorder: menuBorderClass,
    menuShadow: menuShadowClass,
    currentTheme
  });

  const handleSaveNote = () => {
    updateNode(nodeId, { note: noteText });
    setNoteModalOpen(false);
  };

  const handleNoteModalOpen = () => {
    setNoteText(data.note || '');
    setNoteModalOpen(true);
  };

  return (
    <>
      <div className={`flex gap-1 rounded-lg p-2 border ${menuBackgroundClass} ${menuBorderClass} ${menuShadowClass}`}>
        <Tooltip content={isPinned ? 'Unpin' : 'Pin visually'} position="bottom">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onClick={e => {
              e.stopPropagation();
              isPinned ? unpinNode() : pinNode(nodeId);
            }}
          >
            <PushPinIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Make Root" position="bottom">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onClick={e => {
              e.stopPropagation();
              makeNodeRoot(nodeId);
            }}
          >
            <StarIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Add/Edit Note" position="bottom">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onClick={e => {
              e.stopPropagation();
              handleNoteModalOpen();
            }}
          >
            <NoteAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

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
    </>
  );
} 