import React, { useState, useEffect } from 'react';
import { Button, Modal, TextInput, TextArea } from 'pres-start-core';
import { saveFlow, getUserFlows, loadFlow, deleteFlow, getActiveFlow, getFlowVersions, revertToVersion } from '../utils/supabase';
import { useNodesStore } from '../hooks/useNodesStore';

export default function FlowManager() {
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

  const nodes = useNodesStore((state) => state.nodes);
  const edges = useNodesStore((state) => state.edges);
  const setNodes = useNodesStore((state) => state.setNodes);
  const setEdges = useNodesStore((state) => state.setEdges);

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

    try {
      await deleteFlow(flowId);
      await loadFlows();
      if (activeFlow && activeFlow.id === flowId) {
        setActiveFlow(null);
      }
      setMessage('Flow deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting flow: ' + error.message);
    }
  };

  const handleNewFlow = () => {
    if (nodes.length > 0 || edges.length > 0) {
      if (!confirm('This will clear your current flow. Are you sure you want to start a new flow?')) {
        return;
      }
    }
    
    // Clear current flow
    setNodes([]);
    setEdges([]);
    setActiveFlow(null);
    setMessage('Started new flow');
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenVersionModal = async () => {
    if (!activeFlow) {
      setMessage('No active flow to show versions for');
      return;
    }

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
    if (!confirm(`Are you sure you want to revert to version ${versionNumber}? This will replace your current flow.`)) {
      return;
    }

    setLoading(true);
    try {
      const revertedFlow = await revertToVersion(activeFlow.id, versionNumber);
      
      // Update the current flow with the reverted data
      if (revertedFlow && revertedFlow.flow_data) {
        setNodes(revertedFlow.flow_data.nodes || []);
        setEdges(revertedFlow.flow_data.edges || []);
        setActiveFlow(revertedFlow);
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
      {/* Flow Management Buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="small"
          onClick={handleNewFlow}
          className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
        >
          New Flow
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={handleOpenSaveModal}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
        >
          Save Flow
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowLoadModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
        >
          Load Flow
        </Button>
        {activeFlow && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleOpenVersionModal}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            disabled={loadingVersions}
          >
            {loadingVersions ? 'Loading...' : 'Versions'}
          </Button>
        )}
      </div>

      {/* Current Flow Display */}
      {activeFlow && (
        <div className="text-sm text-gray-300 mt-2">
          Current: <span className="font-semibold">{activeFlow.name}</span>
          {activeFlow.description && (
            <span className="text-gray-400 ml-2">- {activeFlow.description}</span>
          )}
          <span className="text-gray-500 ml-2">• Updated {formatDate(activeFlow.updated_at)}</span>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`text-sm mt-2 ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </div>
      )}

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
            variant="secondary"
            onClick={() => setShowSaveModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveFlow}
            disabled={loading || !flowName.trim()}
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
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeFlow?.id === flow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleLoadFlow(flow.id)}>
                      <div className="font-semibold text-gray-900">{flow.name}</div>
                      {flow.description && (
                        <div className="text-sm text-gray-600 mt-1">{flow.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {flow.flow_data?.nodes?.length || 0} nodes • 
                        {flow.flow_data?.edges?.length || 0} connections • 
                        {formatDate(flow.updated_at)}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleDeleteFlow(flow.id, flow.name)}
                      className="ml-2 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
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
            variant="secondary"
            onClick={() => setShowLoadModal(false)}
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
        title={`Version History - ${activeFlow?.name}`}
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
                  key={version.id}
                  className="p-3 border border-gray-300 rounded-lg transition-colors hover:border-gray-400"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Version {version.version_number}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(version.created_at)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {version.flow_data?.nodes?.length || 0} nodes • 
                        {version.flow_data?.edges?.length || 0} connections
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleRevertToVersion(version.version_number)}
                      className="ml-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                      disabled={loading}
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
            variant="secondary"
            onClick={() => setShowVersionModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
} 