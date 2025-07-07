import React from 'react';
import LogoutIcon from '@mui/icons-material/Logout';

export const SignOutButton = ({ onClick, disabled = false }) => {
  return (
    <button
      className="block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-b-lg disabled:opacity-60 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      <LogoutIcon fontSize="small" className="mr-2" />
      Sign Out
    </button>
  );
}; 