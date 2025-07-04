import React, { useState } from 'react';
import { IconButton, Modal, TextArea, TextInput, Button, Tooltip, SelectInput } from 'pres-start-core';
import { useReactFlow } from 'reactflow';
import { generateSingleIdea, getAvailableProviders } from '../utils/aiProvider';
import { useNodesStore } from '../hooks/useNodesStore';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function NodeToolbarAdd({ nodeId, data, addNode, updateNode, nodes }) {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState('idea');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const reactFlowInstance = useReactFlow();
  const deleteNode = useNodesStore((state) => state.deleteNode);
  const activeRootId = useNodesStore((state) => state.activeRootId);
  
  // AI Provider/Model selection from global state
  const aiProvider = useNodesStore((state) => state.aiProvider);
  const aiModel = useNodesStore((state) => state.aiModel);
  const setAIProviderAndModel = useNodesStore((state) => state.setAIProviderAndModel);

  // Get available providers and models
  const availableProviders = getAvailableProviders();
  const currentProvider = availableProviders.find(p => p.id === aiProvider);
  const currentModels = currentProvider?.models || [];

  // add node from the node button
  const handleAdd = () => {
    setNewTitle('');
    setNewSummary('');
    setAddModalOpen(true);
  };

  // "confirm" the add node
  const handleConfirmAdd = () => {
    const label = newTitle.trim();
    const summary = newSummary.trim();
    if (label) {
      const fullLabel = label + (summary ? `\n${summary}` : '');
      
      const currentTime = Date.now();
      const randomOffset = Math.sin(currentTime) * 50;
      
      const offset = 160;
      const newPosition = {
        x: reactFlowInstance.getNode(nodeId).position.x + offset + randomOffset,
        y: reactFlowInstance.getNode(nodeId).position.y + offset + randomOffset,
      };
      
      const dx = newPosition.x - reactFlowInstance.getNode(nodeId).position.x;
      const dy = newPosition.y - reactFlowInstance.getNode(nodeId).position.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      let sourceHandle = 'right-source';
      let targetHandle = 'left-target';
      
      if (absDx > absDy) {
        sourceHandle = dx > 0 ? 'right-source' : 'left-source';
        targetHandle = dx > 0 ? 'left-target' : 'right-target';
      } else {
        sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
        targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
      }
      
      addNode(nodeId, fullLabel, '', newPosition, {
        sourceHandle,
        targetHandle,
        parentId: nodeId
      });
    }
    setAddModalOpen(false);
  };

  // handle Generate AI modal confirmed generate
  const handleGenerateAIConfirm = async () => {
    setGenerateModalOpen(false);
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    try {
      const rootNode = nodes.find(n => n.id === activeRootId)?.data?.label || '';
      const parentNodes = [];
      let parentId = data.parentId;
      while (parentId && parentId !== 'root') {
        const parent = nodes.find(n => n.id === parentId);
        if (parent) {
          parentNodes.unshift(parent.data?.label || '');
          parentId = parent.data?.parentId;
        } else {
          break;
        }
      }
      const currentNode = data.label || '';

      const ideaText = await generateSingleIdea({
        rootNode,
        parentNodes,
        currentNode,
        promptType: selectedPromptType,
        provider: aiProvider,
        model: aiModel,
      });

      if (ideaText && typeof ideaText === 'string') {
        const currentNodeObj = reactFlowInstance.getNode(nodeId);
        const offset = 160;
        const currentTime = Date.now();
        const randomOffset = Math.sin(currentTime) * 50;
        const newPosition = {
          x: currentNodeObj.position.x + offset + randomOffset,
          y: currentNodeObj.position.y + offset + randomOffset,
        };
        const dx = newPosition.x - currentNodeObj.position.x;
        const dy = newPosition.y - currentNodeObj.position.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let sourceHandle = 'right-source';
        let targetHandle = 'left-target';
        if (absDx > absDy) {
          sourceHandle = dx > 0 ? 'right-source' : 'left-source';
          targetHandle = dx > 0 ? 'left-target' : 'right-target';
        } else {
          sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
          targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
        }
        addNode(nodeId, ideaText, '', newPosition, {
          sourceHandle,
          targetHandle,
          parentId: nodeId,
        });
      } else {
        console.error('Failed to generate AI idea:', ideaText);
      }
    } catch (error) {
      console.error('Error generating AI idea:', error);
    } finally {
      window.dispatchEvent(new CustomEvent('ai-thinking-end'));
    }
  };

  const handleDeleteNode = () => {
    if (nodeId === 'root') {
      console.warn('Cannot delete the root node.');
      return;
    }
    deleteNode(nodeId);
  };

  return (
    <>
      <div className="flex gap-1 rounded-lg p-2 border bg-white/10 backdrop-blur-sm border-white/20 shadow-lg">
        <Tooltip position="bottom" content="Add idea">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onClick={e => {
              e.stopPropagation();
              handleAdd();
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip position="bottom" content="Generate AI Idea">
          <IconButton
            size="small"
            variant="primary"
            shape="circle"
            onClick={e => {
              e.stopPropagation();
              setGenerateModalOpen(true);
            }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {nodeId !== 'root' && (
          <Tooltip position="bottom" content="Delete Node">
            <IconButton
              size="small"
              variant="primary"
              shape="circle"
              onClick={e => {
                e.stopPropagation();
                handleDeleteNode();
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {/* Add Idea Modal */}
      <Modal variant="custom" className="w-full min-w-96 max-w-md" isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Idea">
        <div className="space-y-4">
          <TextInput
            label="Title"
            placeholder="New idea title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextArea
            label="Summary"
            placeholder="Optional summary"
            rows={2}
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setAddModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmAdd}>
            Add Idea
          </Button>
        </div>
      </Modal>

      {/* Generate AI Type Modal */}
      <Modal variant="custom" className="w-full min-w-96 max-w-md" isOpen={isGenerateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate AI Response">
        <div className="space-y-4">
          <p className="font-semibold">As...</p>
          <div className="flex flex-col space-y-2">
            {['question', 'idea', 'task', 'note'].map((type) => (
              <label key={type} className="inline-flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="promptType"
                  value={type}
                  checked={selectedPromptType === type}
                  onChange={() => setSelectedPromptType(type)}
                  className="form-radio text-blue-600"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
          
          {/* AI Provider/Model Selection */}
          <div className="space-y-2 pt-4 border-t border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                AI Provider
              </label>
              <SelectInput
                value={aiProvider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  const providerConfig = availableProviders.find(p => p.id === newProvider);
                  const defaultModel = providerConfig?.models[0]?.id || 'gpt-4o';
                  setAIProviderAndModel(newProvider, defaultModel);
                }}
                className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              >
                {availableProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                AI Model
              </label>
              <SelectInput
                value={aiModel}
                onChange={(e) => setAIProviderAndModel(aiProvider, e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              >
                {currentModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setGenerateModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerateAIConfirm}>
            Generate
          </Button>
        </div>
      </Modal>
    </>
  );
} 