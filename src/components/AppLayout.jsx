import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import SetApiKey from './SetApiKey';


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

  return (
    <div className="flex flex-col h-screen">
      <ErrorBoundary>
        <TopBar />
      </ErrorBoundary>
      <SetApiKey />
      
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <Sidebar />
      </div>
    </div>
  );
}
