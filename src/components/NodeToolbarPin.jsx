import React, { useState } from 'react';
import { IconButton, Tooltip, Modal, Button } from 'pres-start-core';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { useNodesStore } from '../hooks/useNodesStore';
import { useThemeStore } from '../hooks/useThemeStore';
// TipTap imports
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import SimpleEditorToolbar from './SimpleEditorToolbar';

export default function NodeToolbarPin({ nodeId, isPinned, data, updateNode }) {
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  // Store the note as HTML
  const [noteHtml, setNoteHtml] = useState('');

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

  // TipTap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Underline
    ],
    content: noteHtml,
    onUpdate: ({ editor }) => {
      setNoteHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] p-2 rounded-b border border-gray-200 focus:outline-none bg-white',
      },
    },
  });

  const handleSaveNote = () => {
    updateNode(nodeId, { note: noteHtml });
    setNoteModalOpen(false);
  };

  const handleNoteModalOpen = () => {
    setNoteHtml(data.note || '');
    setNoteModalOpen(true);
    setTimeout(() => {
      if (editor) editor.commands.setContent(data.note || '');
    }, 0);
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
      <Modal className="w-full min-w-[400px] max-w-2xl" isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} title="Add/Edit Note">
        <div className="space-y-4">
          {/* TipTap WYSIWYG Editor with Toolbar */}
          <div className="border border-gray-200 rounded">
            <SimpleEditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          <div className="text-xs text-gray-500">You can format text and add links. (No images supported.)</div>
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