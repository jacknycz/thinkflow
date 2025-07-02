import React, { useState, useRef } from 'react';
import { IconButton, Tooltip } from 'pres-start-core';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { useNodesStore } from '../hooks/useNodesStore';
import NodeToolbarPin from './NodeToolbarPin';
import NodeToolbarAdd from './NodeToolbarAdd';

export default function NodeMenu({ nodeId, data, addNode, updateNode, nodes, isPinned }) {
  const [pinMenuHovered, setPinMenuHovered] = useState(false);
  const [addMenuHovered, setAddMenuHovered] = useState(false);
  const pinTimeoutRef = useRef(null);
  const addTimeoutRef = useRef(null);

  const handlePinMouseEnter = () => {
    if (pinTimeoutRef.current) {
      clearTimeout(pinTimeoutRef.current);
    }
    setPinMenuHovered(true);
  };

  const handlePinMouseLeave = () => {
    pinTimeoutRef.current = setTimeout(() => {
      setPinMenuHovered(false);
    }, 100);
  };

  const handleAddMouseEnter = () => {
    if (addTimeoutRef.current) {
      clearTimeout(addTimeoutRef.current);
    }
    setAddMenuHovered(true);
  };

  const handleAddMouseLeave = () => {
    addTimeoutRef.current = setTimeout(() => {
      setAddMenuHovered(false);
    }, 100);
  };

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 flex gap-2 z-20">
      {/* Add Menu Button */}
      <div className="relative">
        <Tooltip content="Add Options" position="top">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onMouseEnter={handleAddMouseEnter}
            onMouseLeave={handleAddMouseLeave}
            onClick={e => e.stopPropagation()}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {/* Add Menu Expansion */}
        <div 
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-all duration-200 ease-out ${
            addMenuHovered 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
          onMouseEnter={handleAddMouseEnter}
          onMouseLeave={handleAddMouseLeave}
        >
          <NodeToolbarAdd 
            nodeId={nodeId} 
            data={data} 
            addNode={addNode} 
            updateNode={updateNode} 
            nodes={nodes} 
          />
        </div>
      </div>

      {/* More Options Menu Button */}
      <div className="relative">
        <Tooltip content="More Options" position="top">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onMouseEnter={handlePinMouseEnter}
            onMouseLeave={handlePinMouseLeave}
            onClick={e => e.stopPropagation()}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {/* More Options Menu Expansion */}
        <div 
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-all duration-200 ease-out ${
            pinMenuHovered 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
          onMouseEnter={handlePinMouseEnter}
          onMouseLeave={handlePinMouseLeave}
        >
          <NodeToolbarPin 
            nodeId={nodeId} 
            isPinned={isPinned} 
            data={data}
            updateNode={updateNode}
          />
        </div>
      </div>
    </div>
  );
} 