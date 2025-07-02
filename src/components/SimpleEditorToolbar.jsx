import React from 'react';
import { IconButton, Tooltip } from 'pres-start-core';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';

export default function SimpleEditorToolbar({ editor }) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const toggleLink = () => {
    if (editor.isActive('link')) {
      removeLink();
    } else {
      addLink();
    }
  };

  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t">
      <Tooltip content="Bold" position="bottom">
        <IconButton
          size="small"
          variant={editor.isActive('bold') ? 'primary' : 'secondary'}
          shape="circle"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip content="Italic" position="bottom">
        <IconButton
          size="small"
          variant={editor.isActive('italic') ? 'primary' : 'secondary'}
          shape="circle"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip content="Underline" position="bottom">
        <IconButton
          size="small"
          variant={editor.isActive('underline') ? 'primary' : 'secondary'}
          shape="circle"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip content="Add/Remove Link" position="bottom">
        <IconButton
          size="small"
          variant={editor.isActive('link') ? 'primary' : 'secondary'}
          shape="circle"
          onClick={toggleLink}
        >
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
} 