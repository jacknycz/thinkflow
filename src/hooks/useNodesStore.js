// src/hooks/useNodesStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const useNodesStore = create((set, get) => ({
  nodes: [], // Start with an empty canvas
  edges: [],

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === 'function' ? updater(state.edges) : updater,
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      ),
    })),

  getRootNode: () => get().nodes.find((n) => n.id === 'root'),

  addNode: (parentId, title, summary = '', position = null, extraData = {}) => {
    const isRootNode = parentId === 'root' && !get().nodes.find((n) => n.id === 'root');
    const id = isRootNode ? 'root' : nanoid();
    const parent = get().nodes.find((n) => n.id === parentId);
    const offset = 160;
  
    const newNode = {
      id,
      type: 'custom',
      position: position || {
        x: parent ? parent.position.x + offset : Math.random() * 400 + 100,
        y: parent ? parent.position.y + offset : Math.random() * 400 + 100,
      },
      data: {
        label: title,
        summary,
        note: '',
        parentId,
        ...extraData, // 👈 inject backgroundColor here
      },
    };
  
    const newEdge = !isRootNode ? {
      id: `${parentId}->${id}`,
      source: parentId,
      target: id,
      type: 'smoothstep',
    } : null;
  
    set((state) => ({
      nodes: [...state.nodes, newNode],
      edges: newEdge ? [...state.edges, newEdge] : state.edges,
    }));
  },
  

  ideaBuffet: [],
  setIdeaBuffet: (buffet) => set({ ideaBuffet: buffet }),
  removeIdeaFromBuffet: (title) =>
    set((state) => ({
      ideaBuffet: state.ideaBuffet.filter((idea) => idea.title !== title),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    })),
}));
