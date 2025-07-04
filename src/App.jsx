// src/App.jsx
import React from 'react';
import { AppLayout } from './components/AppLayout';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Auth from './components/Auth';

function AppContent() {
  const { user, loading } = useAuth();

  console.log('🚀 AppContent: Render state:', { user: !!user, loading, userEmail: user?.email });

  if (loading) {
    console.log('🚀 AppContent: Showing loading screen...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-p-900 via-p-800 to-p-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading ThinkFlow...</div>
      </div>
    );
  }

  if (!user) {
    console.log('🚀 AppContent: No user, showing auth modal...');
    return <Auth />;
  }

  console.log('🚀 AppContent: User authenticated, showing AppLayout...');
  return <AppLayout />;
}

export default function App() {
  console.log('🚀 App: Rendering main App component...');
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
