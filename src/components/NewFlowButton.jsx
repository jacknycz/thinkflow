import React from 'react';
import AddIcon from '@mui/icons-material/Add';

export const NewFlowButton = ({ onClick, disabled = false }) => {
  return (
    <button
      className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-t-lg disabled:opacity-60 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      <AddIcon fontSize="small" className="mr-2" />
      New Flow
    </button>
  );
}; 