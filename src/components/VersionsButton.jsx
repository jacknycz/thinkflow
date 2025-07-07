import React from 'react';
import HistoryIcon from '@mui/icons-material/History';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export const VersionsButton = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-60 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <>
          <HourglassEmptyIcon fontSize="small" className="mr-2" />
          Loading...
        </>
      ) : (
        <>
          <HistoryIcon fontSize="small" className="mr-2" />
          Versions
        </>
      )}
    </button>
  );
}; 