// src/hooks/useNodesStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { generateIdea } from '../utils/openai';

export const useNodesStore = create((set, get) => ({
  nodes: [
    {
      id: 'root',
      label: 'Things to do in Bend oregon',
      parentId: null,
      children: [],
      mode: 'idea',
      position: { x: 400, y: 300 },
      ideas: [],
      note: '', // Add this line
    },
  ],

  addNode: (parentId, label = 'New Idea') =>
    set((state) => {
      const newId = nanoid();
      const newNode = {
        id: newId,
        label: typeof label === 'object' ? `${label.title}\n${label.summary}` : label,
        parentId,
        children: [],
        mode: 'idea',
        position: {
          x: Math.random() * 300 + 300,
          y: Math.random() * 300 + 300,
        },
        ideas: [],
      };

      const updatedNodes = state.nodes.map((node) =>
        node.id === parentId
          ? { ...node, children: [...node.children, newId] }
          : node
      );

      return {
        nodes: [...updatedNodes, newNode],
      };
    }),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    })),

  removeNode: (id) =>
    set((state) => {
      const getDescendants = (targetId) => {
        const node = state.nodes.find((n) => n.id === targetId);
        if (!node) return [];
        return node.children.flatMap((childId) => [
          childId,
          ...getDescendants(childId),
        ]);
      };

      const idsToRemove = [id, ...getDescendants(id)];
      return {
        nodes: state.nodes.filter((node) => !idsToRemove.includes(node.id)),
      };
    }),

  generateAIChild: async (nodeId) => {
    const { nodes, addNode } = useNodesStore.getState();
    const node = nodes.find((n) => n.id === nodeId);
    const root = nodes.find((n) => n.id === 'root');

    if (!node || !root) {
      console.warn('Node or root not found');
      return;
    }

    const isRoot = node.id === root.id;

    const getTitleOnly = (label) => {
      if (typeof label === 'string') {
        return label.split('\n')[0];
      } else if (label?.title) {
        return label.title;
      }
      return 'Untitled';
    };

    const prompt = isRoot
      ? root.label
      : `${root.label} → ${getTitleOnly(node.label)}`;

    console.log('Generating idea for prompt:', prompt);
    const idea = await generateIdea(prompt);
    console.log('Generated idea:', idea);
    addNode(nodeId, idea);
  },

  addIdeaToNode: (nodeId, idea) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, ideas: [...(node.ideas || []), idea] }
          : node
      ),
    })),
}));
