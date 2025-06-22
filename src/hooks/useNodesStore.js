// src/hooks/useNodesStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const useNodesStore = create((set, get) => ({
  // set empty canvas
  nodes: [], 
  edges: [],

  // set the nodes
  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater,
    })),

  // set the edges - not repeated code from above ya dork
  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === 'function' ? updater(state.edges) : updater,
    })),

  // get the root node
  getRootNode: () => get().nodes.find((n) => n.id === 'root'),

  updateNode: (id, updates) =>
    set((state) => {
      const node = state.nodes.find(n => n.id === id);
      if (!node) return state;

      // If sourceHandle or targetHandle is being updated, update the corresponding edge
      if ((updates.sourceHandle || updates.targetHandle) && node.data.parentId) {
        const edge = state.edges.find(e => e.target === id);
        if (edge) {
          const edgeUpdates = {};
          if (updates.sourceHandle) edgeUpdates.sourceHandle = updates.sourceHandle;
          if (updates.targetHandle) edgeUpdates.targetHandle = updates.targetHandle;
          
          return {
            nodes: state.nodes.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, ...updates } } : n
            ),
            edges: state.edges.map((e) =>
              e.id === edge.id ? { ...e, ...edgeUpdates } : e
            ),
          };
        }
      }

      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...updates } } : n
        ),
      };
    }),

  addNode: (parentId, title, summary = '', position = null, extraData = {}) => {
    const isRootNode = parentId === 'root' && !get().nodes.find((n) => n.id === 'root');
    const id = isRootNode ? 'root' : nanoid();
    const parent = get().nodes.find((n) => n.id === parentId);
    const offset = 160;

    let backgroundColor = extraData.backgroundColor || '';

    if (!backgroundColor && parentId === 'root' && !isRootNode) {
      const rootChildren = get().nodes.filter((node) => node.data.parentId === 'root');
      const colors = ['#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9'];
      const colorIndex = rootChildren.length % colors.length;
      backgroundColor = colors[colorIndex];
    } else if (!backgroundColor && parent) {
      backgroundColor = parent.data.backgroundColor || '';
    }

    // If backgroundColor is still not defined, fallback to what's passed in
    if (!backgroundColor && extraData.backgroundColor) {
      backgroundColor = extraData.backgroundColor;
    }

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
        backgroundColor,
        ...extraData,
      },
    };

    const newEdge = !isRootNode
      ? {
        id: `${parentId}->${id}`,
        source: parentId,
        target: id,
        type: 'bezier',
        sourceHandle: extraData.sourceHandle || 'right-source',
        targetHandle: extraData.targetHandle || 'left-target'
      }
      : null;

    console.log('🔧 addNode creating:', {
      newNode,
      newEdge,
      isRootNode,
      parentId,
      extraData
    });

    if (newEdge) {
      console.log('🔗 Edge details:', {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        sourceHandle: newEdge.sourceHandle,
        targetHandle: newEdge.targetHandle,
        type: newEdge.type
      });
    }

    set((state) => {
      const newState = {
        nodes: [...state.nodes, newNode],
        edges: newEdge ? [...state.edges, newEdge] : state.edges,
      };
      
      console.log('🔧 addNode new state:', {
        nodesCount: newState.nodes.length,
        edgesCount: newState.edges.length,
        latestEdge: newEdge
      });
      
      return newState;
    });
  },

  ideaBuffet: [],
  setIdeaBuffet: (buffet) => set({ ideaBuffet: buffet }),
  removeIdeaFromBuffet: (title) => {
    console.log('🗑️ Removing idea from buffet:', title);
    set((state) => {
      const newBuffet = state.ideaBuffet.filter((idea) => idea.title !== title);
      console.log('🗑️ New buffet state:', {
        oldCount: state.ideaBuffet.length,
        newCount: newBuffet.length,
        removed: title
      });
      return { ideaBuffet: newBuffet };
    });
  },

  deleteNode: (id) =>
    set((state) => {
      // Find the node being deleted
      const deletedNode = state.nodes.find(n => n.id === id);
      if (!deletedNode) return state;

      // Find all children of the deleted node
      const children = state.nodes.filter(n => n.data.parentId === id);
      
      // Find the parent of the deleted node
      const parentNode = state.nodes.find(n => n.id === deletedNode.data.parentId);
      
      // Check if we're reconnecting to root and enforce 5-child limit
      const isReconnectingToRoot = !parentNode || parentNode.id === 'root';
      if (isReconnectingToRoot) {
        const existingRootChildren = state.nodes.filter(n => n.data.parentId === 'root');
        const availableSlots = 5 - existingRootChildren.length;
        
        if (availableSlots < children.length) {
          console.warn('Cannot reconnect all children to root - 5 child limit would be exceeded');
          return state;
        }
      }

      // Update children to connect to the parent's parent (or root if no parent)
      const updatedNodes = state.nodes.map(node => {
        if (node.data.parentId === id) {
          // Calculate new position relative to new parent
          const newParent = parentNode || state.nodes.find(n => n.id === 'root');
          const offset = 160;
          
          return {
            ...node,
            data: {
              ...node.data,
              parentId: newParent?.id || 'root',
              // Keep the same background color
            },
            position: {
              x: newParent ? newParent.position.x + offset : node.position.x,
              y: newParent ? newParent.position.y + offset : node.position.y,
            }
          };
        }
        return node;
      });

      // Remove the deleted node and its edge
      const filteredNodes = updatedNodes.filter(n => n.id !== id);
      const filteredEdges = state.edges.filter(e => e.source !== id && e.target !== id);

      // Create new edges for reconnected children
      const newEdges = children.map(child => {
        // Calculate closest handles for the new connection
        const dx = child.position.x - (parentNode?.position.x || 0);
        const dy = child.position.y - (parentNode?.position.y || 0);
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        let sourceHandle = 'right-source';
        let targetHandle = 'left-target';
        
        // Determine source handle on parent
        if (absDx > absDy) {
          sourceHandle = dx > 0 ? 'right-source' : 'left-source';
        } else {
          sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
        }
        
        // Determine target handle on child (opposite side)
        switch (sourceHandle) {
          case 'right-source':
            targetHandle = 'left-target';
            break;
          case 'left-source':
            targetHandle = 'right-target';
            break;
          case 'top-source':
            targetHandle = 'bottom-target';
            break;
          case 'bottom-source':
            targetHandle = 'top-target';
            break;
          default:
            targetHandle = 'left-target';
        }
        
        return {
          id: `${parentNode?.id || 'root'}->${child.id}`,
          source: parentNode?.id || 'root',
          target: child.id,
          type: 'bezier',
          sourceHandle,
          targetHandle
        };
      });

      return {
        nodes: filteredNodes,
        edges: [...filteredEdges, ...newEdges]
      };
    }),
}));
