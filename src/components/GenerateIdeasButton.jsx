import React from 'react';
import { Button } from 'pres-start-core';

export const GenerateIdeasButton = ({ onClick, disabled = false, loading = false }) => {
  return (
    <Button 
      variant="custom"
      size="default"
      className="glass-morphism-accent"
      onClick={onClick}
      disabled={disabled}
      type="submit"
    >
      {loading ? 'Generating...' : 'Generate'}
    </Button>
  );
}; 