// src/components/CustomNodeWrapper.jsx
import React from 'react';
import CustomNode from './CustomNode';
import { useNodesStore } from '../hooks/useNodesStore';

export default function CustomNodeWrapper(props) {
  const addNode = useNodesStore((state) => state.addNode);
  const updateNode = useNodesStore((state) => state.updateNode);
  const nodes = useNodesStore((state) => state.nodes);
  return <CustomNode {...props} addNode={addNode} updateNode={updateNode} nodes={nodes} />;
}
