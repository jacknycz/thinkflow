const updateNode = (id, updates) => {
  console.log(`Updating node ${id} with updates:`, updates); // Debugging log
  setNodes((prevNodes) =>
    prevNodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
    )
  );
};
