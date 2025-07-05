import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNodesStore } from '../hooks/useNodesStore';
import { getActiveFlow } from '../utils/supabase';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

export function AppLayout() {
  const { user } = useAuth();
  const setNodes = useNodesStore((state) => state.setNodes);
  const setEdges = useNodesStore((state) => state.setEdges);

  useEffect(() => {
    async function loadInitialFlow() {
      if (user) {
        const active = await getActiveFlow();
        if (active && active.flow_data) {
          setNodes(active.flow_data.nodes || []);
          setEdges(active.flow_data.edges || []);
        }
      }
    }
    loadInitialFlow();
  }, [user, setNodes, setEdges]);

  return (
    <div className="flex flex-col h-screen bg-thinkFlow-bg text-thinkFlow-text">
      <ErrorBoundary>
        <TopBar />
      </ErrorBoundary>
      
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <Sidebar />
      </div>
    </div>
  );
}
