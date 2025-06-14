import { useNodesStore } from '../hooks/useNodesStore';

export const NodesList = () => {
    const nodes = useNodesStore((state) => state.nodes);
    return (
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            {node.label} (id: {node.id})
          </li>
        ))}
      </ul>
    );
  };
  