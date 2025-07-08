import React from 'react';
import { Button } from 'pres-start-core';

export const AddToNodeButton = ({ nodeId, nodeLabel, onClick, disabled = false }) => {
  const truncate = (text) => {
    if (!text) return 'Unnamed';
    return text.length > 8 ? text.slice(0, 8) + '...' : text;
  };

  return (
    <Button
      onClick={() => onClick(nodeId)}
      variant="custom"
      size="small"
      title={`Add to ${nodeLabel ?? 'Unnamed node'}`}
              className="text-xs"
      disabled={disabled}
    >
      {truncate(nodeLabel)}
    </Button>
  );
}; 