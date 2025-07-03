import React, { useRef } from 'react';
import { IconButton, Tooltip } from 'pres-start-core';
import AddIcon from '@mui/icons-material/Add';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function NodeBottomToolbar({
  onAddClick,
  onAddMenuEnter,
  onAddMenuLeave,
  showAddMenu,
  aiLoading,
  handleGenerateAIThought,
  handleAddNode,
  handleNoteClick,
  handleDeleteClick,
  handleFileUpload,
  canDelete,
}) {
  const fileInputRef = useRef(null);

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length && handleFileUpload) {
      handleFileUpload(files);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="flex w-full h-12 rounded-full border border-white/20 shadow-lg bg-white/5">
      {/* Add Button with submenu */}
      <div className="relative flex-1 h-full flex items-center justify-center" onMouseEnter={onAddMenuEnter} onMouseLeave={onAddMenuLeave}>
        <button
            className="w-full h-full flex items-center justify-center transition-colors duration-200 bg-transparent hover:bg-white/20 rounded-l-full text-white"
            onClick={onAddClick}
            tabIndex={0}
            type="button"
          >
            <AddIcon fontSize="medium" className="text-white mx-auto" />
          </button>
        {/* Submenu */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-0 min-w-[180px] rounded-lg bg-gray-800/90 text-gray-100 shadow-xl transition-all z-50 ${
            showAddMenu ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ paddingTop: 0 }}
        >
          <button className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-t-lg disabled:opacity-60" onClick={handleGenerateAIThought} disabled={aiLoading}>{aiLoading ? 'Generating...' : '+ AI Thought'}</button>
          <button className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700" onClick={() => handleAddNode('AI Question')}>+ AI Question</button>
          <button className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700" onClick={() => handleAddNode('AI Ramble')}>+ AI Ramble</button>
          <button className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-b-lg" onClick={() => handleAddNode('Blank Node')}>+ Blank Node</button>
        </div>
      </div>
      {/* Note Button */}
      <div className="flex-1 h-full flex items-center justify-center">
        <button
          className="w-full h-full flex items-center justify-center bg-transparent hover:bg-white/20 transition-colors duration-200 rounded-none text-white"
          onClick={handleNoteClick}
          tabIndex={0}
          type="button"
        >
          <NoteAltIcon fontSize="medium" className="text-white mx-auto" />
        </button>
      </div>
      {/* Upload Button */}
      <div className="flex-1 h-full flex items-center justify-center">
        <button
          className="w-full h-full flex items-center justify-center bg-transparent hover:bg-white/20 transition-colors duration-200 rounded-none text-white"
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          type="button"
        >
          <AttachFileIcon fontSize="medium" className="text-white mx-auto" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </button>
      </div>
      {/* Delete Button (always render for layout, but hide if not allowed) */}
      <div className="flex-1 h-full flex items-center justify-center">
        <button
          className={`w-full h-full flex items-center rounded-r-full justify-center bg-transparent hover:bg-white/20 transition-colors duration-200 rounded-none text-white ${canDelete ? '' : 'invisible pointer-events-none'}`}
          onClick={handleDeleteClick}
          tabIndex={canDelete ? 0 : -1}
          type="button"
          disabled={!canDelete}
        >
          <DeleteIcon fontSize="medium" className="text-white mx-auto" />
        </button>
      </div>
    </div>
  );
} 