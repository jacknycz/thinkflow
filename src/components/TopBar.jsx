// src/components/TopBar.jsx
import React, { useState, useEffect } from 'react';
import { Button, TextInput, Modal, SelectInput, TextArea } from 'pres-start-core';
import { useNodesStore } from '../hooks/useNodesStore';
import { useAuth } from '../hooks/useAuth';
import { saveFlow, getUserFlows, loadFlow, deleteFlow, getActiveFlow, getFlowVersions, revertToVersion } from '../utils/supabase';
import Avatar from 'pres-start-core/dist/components/Avatar/Avatar';
import { NewFlowButton } from './NewFlowButton';
import { SaveFlowButton } from './SaveFlowButton';
import { LoadFlowButton } from './LoadFlowButton';
import { VersionsButton } from './VersionsButton';
import { SignOutButton } from './SignOutButton';
import { ChatbotIconButton } from './ChatbotIconButton';
import { AIProviderIconButton } from './AIProviderIconButton';
import { IdeaBuffetIconButton } from './IdeaBuffetIconButton';

export const TopBar = () => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  let avatarMenuTimeout;

  // Flow management state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [flows, setFlows] = useState([]);
  const [activeFlow, setActiveFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [message, setMessage] = useState('');
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const rootNode = useNodesStore((state) => Array.isArray(state.nodes) ? state.nodes.find((n) => n.id === 'root') : null);
  const updateNode = useNodesStore((state) => state.updateNode);
  const addNode = useNodesStore((state) => state.addNode);
  const nodes = useNodesStore((state) => state.nodes);
  const edges = useNodesStore((state) => state.edges);
  const setNodes = useNodesStore((state) => state.setNodes);
  const setEdges = useNodesStore((state) => state.setEdges);
  const { signOut, user } = useAuth();

  // Load flows on component mount
  useEffect(() => {
    loadFlows();
    loadActiveFlow();
  }, []);

  const loadFlows = async () => {
    try {
      const userFlows = await getUserFlows();
      setFlows(userFlows);
    } catch (error) {
      console.error('Error loading flows:', error);
    }
  };

  const loadActiveFlow = async () => {
    try {
      const active = await getActiveFlow();
      setActiveFlow(active);
    } catch (error) {
      console.error('Error loading active flow:', error);
    }
  };

  // Initialize input value when root node changes
  React.useEffect(() => {
    if (rootNode?.data?.label) {
      setInputValue(rootNode.data.label);
    } else {
      // Clear input when there's no root node
      setInputValue('');
    }
  }, [rootNode?.data?.label]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 TopBar Debug:', {
      rootNode: rootNode?.data?.label,
      inputValue,
      hasRootNode: !!rootNode
    });
  }, [rootNode, inputValue]);

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

  // Handlers for hover menu
  const handleAvatarMouseEnter = () => {
    clearTimeout(avatarMenuTimeout);
    setAvatarMenuOpen(true);
  };
  const handleAvatarMouseLeave = () => {
    avatarMenuTimeout = setTimeout(() => setAvatarMenuOpen(false), 120);
  };

  // Flow management handlers
  const handleSaveFlow = async () => {
    if (!flowName.trim()) {
      setMessage('Please enter a flow name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const flowData = {
        nodes,
        edges,
        timestamp: Date.now()
      };

      // Pass the existing flow ID if we have an active flow
      const existingFlowId = activeFlow?.id || null;
      const savedFlow = await saveFlow(flowName.trim(), flowDescription.trim(), flowData, existingFlowId);
      setActiveFlow(savedFlow);
      await loadFlows();
      setShowSaveModal(false);
      setFlowName('');
      setFlowDescription('');
      setMessage(existingFlowId ? 'Flow updated successfully!' : 'Flow saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving flow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSaveModal = () => {
    // Get root node title to pre-populate flow name
    const rootNode = nodes.find(n => n.id === 'root');
    const rootTitle = rootNode?.data?.label || '';
    
    // Set the flow name to the root node title if it exists
    setFlowName(rootTitle);
    setFlowDescription('');
    setShowSaveModal(true);
  };

  const handleLoadFlow = async (flowId) => {
    setLoading(true);
    try {
      const flow = await loadFlow(flowId);
      if (flow && flow.flow_data) {
        // Clear current flow and load new one
        setNodes(flow.flow_data.nodes || []);
        setEdges(flow.flow_data.edges || []);
        setActiveFlow(flow);
        setShowLoadModal(false);
        setMessage(`Loaded flow: ${flow.name}`);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error loading flow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlow = async (flowId, flowName) => {
    if (!confirm(`Are you sure you want to delete "${flowName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteFlow(flowId);
      await loadFlows();
      if (activeFlow?.id === flowId) {
        setActiveFlow(null);
      }
      setMessage(`Deleted flow: ${flowName}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting flow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFlow = () => {
    setNodes([]);
    setEdges([]);
    setActiveFlow(null);
    setAvatarMenuOpen(false);
    setMessage('Started new flow');
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleOpenVersionModal = async () => {
    setLoadingVersions(true);
    try {
      const flowVersions = await getFlowVersions(activeFlow.id);
      setVersions(flowVersions);
      setShowVersionModal(true);
    } catch (error) {
      setMessage('Error loading versions: ' + error.message);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRevertToVersion = async (versionNumber) => {
    setLoading(true);
    try {
      const revertedFlow = await revertToVersion(activeFlow.id, versionNumber);
      if (revertedFlow && revertedFlow.flow_data) {
        setNodes(revertedFlow.flow_data.nodes || []);
        setEdges(revertedFlow.flow_data.edges || []);
        setShowVersionModal(false);
        setMessage(`Reverted to version ${versionNumber}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error reverting to version: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center gap-4 z-50">
        <div className="flex items-center">
          <div className="px-4 py-2 rounded-full bg-white/25 border border-white/30 backdrop-blur-md shadow-lg">
            <img 
              src="/nodal-logo.svg" 
              alt="Nodal" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        
        {!rootNode ? (
          <div className="flex-1 max-w-md mx-4">
            <TextInput
              variant="custom"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleInputKeyPress}
              placeholder="Get started with your idea..."
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-100">{rootNode.data.label}</h2>
            <Button 
              variant="custom"
              size="small"
              onClick={handleUpdateClick}
              className="glass-morphism"
            >
              Update topic
            </Button>
          </div>
        )}

        {/* Right side: AI Tools + Avatar */}
        {user && (
          <div className="flex items-center gap-3">
            {/* AI Tool Icon Buttons */}
            <div className="flex items-center gap-2">
              <ChatbotIconButton />
              <AIProviderIconButton />
              <IdeaBuffetIconButton />
            </div>

            {/* Avatar with custom hover menu */}
            <div
              className="relative"
              onMouseEnter={handleAvatarMouseEnter}
              onMouseLeave={handleAvatarMouseLeave}
            >
              <Avatar
                src={user?.user_metadata?.avatar_url}
                alt={user?.user_metadata?.full_name || 'User'}
                size="default"
                className="border border-thinkFlow-border cursor-pointer glass-morphism"
              />
              <div
                className={`absolute right-0 top-full mt-0 min-w-[200px] rounded-lg bg-gray-800/90 text-gray-100 shadow-xl transition-all z-50 ${
                  avatarMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ paddingTop: 0 }}
              >
                <NewFlowButton onClick={handleNewFlow} />
                <SaveFlowButton onClick={handleOpenSaveModal} />
                <LoadFlowButton onClick={() => setShowLoadModal(true)} />
                {activeFlow && (
                  <VersionsButton 
                    onClick={handleOpenVersionModal}
                    disabled={loadingVersions}
                    loading={loadingVersions}
                  />
                )}
                <SignOutButton onClick={signOut} />
              </div>
            </div>
          </div>
        )}

      </header>

      {/* Update Confirmation Modal */}
      <Modal 
        variant="custom"
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
            variant="custom"
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Enter new topic..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTopic.trim()) {
                handleUpdateConfirm();
              }
            }}
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button 
            variant="custom"
            onClick={handleUpdateCancel}
            className="glass-morphism"
          >
            Cancel
          </Button>
          <Button 
            variant="custom"
            onClick={handleUpdateConfirm}
            disabled={!newTopic.trim()}
            className="bg-gradient-to-r from-thinkFlow-accent to-thinkFlow-accent2 text-white border-none shadow-md hover:opacity-90 glass-morphism-accent"
          >
            Update Topic
          </Button>
        </div>
      </Modal>

      {/* Save Flow Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        variant="custom"
        title="Save Flow"
        className="max-w-md"
      >
        <div className="space-y-4">
          <TextInput
            variant="custom"
            type="text"
            placeholder="Flow name"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="w-full"
          />
          <TextArea
            placeholder="Optional description"
            value={flowDescription}
            onChange={(e) => setFlowDescription(e.target.value)}
            rows={3}
            className="w-full"
          />
          <div className="text-xs text-gray-400">
            This will save {nodes.length} nodes and {edges.length} connections
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="custom"
            onClick={() => setShowSaveModal(false)}
            className="glass-morphism"
          >
            Cancel
          </Button>
          <Button
            variant="custom"
            onClick={handleSaveFlow}
            disabled={loading || !flowName.trim()}
            className="bg-gradient-to-r from-thinkFlow-accent to-thinkFlow-accent2 text-white border-none shadow-md hover:opacity-90 glass-morphism-accent"
          >
            {loading ? 'Saving...' : 'Save Flow'}
          </Button>
        </div>
      </Modal>

      {/* Load Flow Modal */}
      <Modal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        variant="custom"
        title="Load Flow"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {flows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No saved flows found. Save your first flow to get started!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors glass-morphism ${
                    activeFlow?.id === flow.id
                      ? 'border-thinkFlow-accent'
                      : 'border-thinkFlow-border/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleLoadFlow(flow.id)}>
                      <div className="font-semibold text-thinkFlow-text">{flow.name}</div>
                      {flow.description && (
                        <div className="text-sm text-thinkFlow-textSecondary mt-1">{flow.description}</div>
                      )}
                      <div className="text-xs text-thinkFlow-textSecondary mt-1">
                        {flow.flow_data?.nodes?.length || 0} nodes • 
                        {flow.flow_data?.edges?.length || 0} connections • 
                        {formatDate(flow.updated_at)}
                      </div>
                    </div>
                    <Button
                      variant="custom"
                      size="small"
                      onClick={() => handleDeleteFlow(flow.id, flow.name)}
                      className="ml-2 glass-morphism"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="custom"
            onClick={() => setShowLoadModal(false)}
            className="glass-morphism"
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        variant="custom"
        title="Version History"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No version history found for this flow.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.version_number}
                  className="p-3 border rounded-lg transition-colors glass-morphism border-thinkFlow-border/30"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-thinkFlow-text">Version {version.version_number}</div>
                      <div className="text-xs text-thinkFlow-textSecondary mt-1">
                        {formatDate(version.created_at)}
                      </div>
                    </div>
                    <Button
                      variant="custom"
                      size="small"
                      onClick={() => handleRevertToVersion(version.version_number)}
                      disabled={loading}
                      className="ml-2 glass-morphism"
                    >
                      {loading ? 'Reverting...' : 'Revert'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="custom"
            onClick={() => setShowVersionModal(false)}
            className="glass-morphism"
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
};
