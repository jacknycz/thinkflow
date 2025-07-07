import React from 'react';
import SaveIcon from '@mui/icons-material/Save';

export const SaveFlowButton = ({ onClick, disabled = false }) => {
  return (
    <button
      className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-60 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      <SaveIcon fontSize="small" className="mr-2" />
      Save Flow
    </button>
  );
}; 