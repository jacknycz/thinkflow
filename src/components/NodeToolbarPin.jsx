import React from 'react';
import { IconButton, Tooltip } from 'pres-start-core';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import { useNodesStore } from '../hooks/useNodesStore';
import { useThemeStore } from '../hooks/useThemeStore';

export default function NodeToolbarPin({ nodeId, isPinned }) {
  const pinNode = useNodesStore(s => s.pinNode);
  const unpinNode = useNodesStore(s => s.unpinNode);
  const makeNodeRoot = useNodesStore(s => s.makeNodeRoot);
  
  // Theme store - subscribe to currentTheme to trigger re-renders
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const getThemeProperty = useThemeStore((state) => state.getThemeProperty);

  // Get theme properties
  const menuBackgroundClass = getThemeProperty('menuBackground');
  const menuBorderClass = getThemeProperty('menuBorder');
  const menuShadowClass = getThemeProperty('menuShadow');

  console.log(`🎨 NodeToolbarPin theme classes:`, {
    menuBackground: menuBackgroundClass,
    menuBorder: menuBorderClass,
    menuShadow: menuShadowClass,
    currentTheme
  });

  return (
    <div className={`flex gap-1 rounded-lg p-2 border ${menuBackgroundClass} ${menuBorderClass} ${menuShadowClass}`}>
      <Tooltip content={isPinned ? 'Unpin' : 'Pin visually'} position="top">
        <IconButton
          size="small"
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
      <Tooltip content="Make Root" position="top">
        <IconButton
          size="small"
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