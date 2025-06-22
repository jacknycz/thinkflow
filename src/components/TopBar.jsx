// src/components/TopBar.jsx
import React, { useState } from 'react';
import { Button, TextInput, Modal } from 'pres-start-core';
import { useNodesStore } from '../hooks/useNodesStore';

export const TopBar = () => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [inputValue, setInputValue] = useState('');

  const rootNode = useNodesStore((state) => Array.isArray(state.nodes) ? state.nodes.find((n) => n.id === 'root') : null);
  const updateNode = useNodesStore((state) => state.updateNode);
  const addNode = useNodesStore((state) => state.addNode);

  // Initialize input value when root node changes
  React.useEffect(() => {
    setInputValue(rootNode?.data?.label || '');
  }, [rootNode?.data?.label]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      if (!rootNode) {
        // Create new root node
        addNode('root', inputValue.trim());
        setInputValue('');
      }
    }
  };

  const handleUpdateClick = () => {
    setNewTopic(rootNode?.data?.label || '');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateConfirm = () => {
    if (newTopic.trim()) {
      updateNode('root', { label: newTopic.trim() });
      setIsUpdateModalOpen(false);
      setNewTopic('');
    }
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    setNewTopic('');
  };

  return (
    <>
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg p-4 flex justify-between items-center gap-4 top-0 left-0 right-0 z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🧠💦 ThinkFlow
        </h1>
        
        {!rootNode ? (
          <div className="flex-1 max-w-md mx-4">
            <TextInput
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleInputKeyPress}
              placeholder="Get started with your idea..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-100">{rootNode.data.label}</h2>
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleUpdateClick}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500"
            >
              Update topic
            </Button>
          </div>
        )}
      </header>

      {/* Update Confirmation Modal */}
      <Modal 
        isOpen={isUpdateModalOpen} 
        onClose={handleUpdateCancel} 
        title="Update Root Topic"
        className="bg-gray-800 border-gray-700"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Update your main topic:
          </p>
          <TextInput
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Enter new topic..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTopic.trim()) {
                handleUpdateConfirm();
              }
            }}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button 
            variant="secondary" 
            onClick={handleUpdateCancel}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateConfirm}
            disabled={!newTopic.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
          >
            Update Topic
          </Button>
        </div>
      </Modal>
    </>
  );
};
