import React from 'react';
import { IconButton, Tooltip } from 'pres-start-core';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import { useNodesStore } from '../hooks/useNodesStore';

export default function NodeToolbar({ nodeId, isPinned }) {
  const pinNode = useNodesStore(s => s.pinNode);
  const unpinNode = useNodesStore(s => s.unpinNode);
  const makeNodeRoot = useNodesStore(s => s.makeNodeRoot);

  return (
    <div className="absolute top-2 left-2 flex gap-1 z-10">
      <Tooltip content={isPinned ? 'Unpin' : 'Pin visually'}>
        <IconButton
          size="sm"
          variant="primary"
          shape="circle"
          onClick={e => {
            e.stopPropagation();
            isPinned ? unpinNode() : pinNode(nodeId);
          }}
        >
          <PushPinIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip content="Make Root">
        <IconButton
          size="sm"
          variant="primary"
          shape="circle"
          onClick={e => {
            e.stopPropagation();
            makeNodeRoot(nodeId);
          }}
        >
          <StarIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
} 