// src/components/CustomNodeWrapper.jsx
import React from 'react';
import CustomNode from './CustomNode';
import { useNodesStore } from '../hooks/useNodesStore';

export default function CustomNodeWrapper(props) {
  const addNode = useNodesStore((state) => state.addNode);
  return <CustomNode {...props} addNode={addNode} />;
}
