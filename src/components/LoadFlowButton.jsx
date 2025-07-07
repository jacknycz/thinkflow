import React from 'react';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

export const LoadFlowButton = ({ onClick, disabled = false }) => {
  return (
    <button
      className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-60 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      <FolderOpenIcon fontSize="small" className="mr-2" />
      Load Flow
    </button>
  );
}; 