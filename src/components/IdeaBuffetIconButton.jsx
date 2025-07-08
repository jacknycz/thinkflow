import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextInput, Button } from 'pres-start-core';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CloseIcon from '@mui/icons-material/Close';
import { useNodesStore } from '../hooks/useNodesStore';

export const IdeaBuffetIconButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ideaBuffet, setIdeaBuffet] = useState([]);
  const [isGeneratingIdeasBuffet, setIsGeneratingIdeasBuffet] = useState(false);
  const [ideaPrompt, setIdeaPrompt] = useState('');

  const rootNode = useNodesStore((state) => Array.isArray(state.nodes) ? state.nodes.find((n) => n.id === 'root') : null);
  const nodes = useNodesStore((state) => state.nodes);

  // Idea Buffet handlers
  const generateIdeasBuffet = async () => {
    if (!ideaPrompt.trim()) return;
    
    setIsGeneratingIdeasBuffet(true);
    try {
      // Your idea generation logic here
      console.log('Generating ideas for buffet:', ideaPrompt);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const newIdeas = [
        {
          title: `Generated Idea: ${ideaPrompt}`,
          summary: `This is a generated idea based on: ${ideaPrompt}`
        }
      ];
      
      setIdeaBuffet(prev => [...newIdeas, ...prev]);
      setIdeaPrompt('');
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGeneratingIdeasBuffet(false);
    }
  };

  const handleAddIdeaToNode = (nodeId, idea) => {
    // Your logic to add idea to node
    console.log('Adding idea to node:', nodeId, idea);
  };

  const truncate = (text) => {
    if (!text) return 'Unnamed';
    return text.length > 8 ? text.slice(0, 8) + '...' : text;
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 h-96 bg-gray-800/90 rounded-xl p-3 border border-gray-600 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-thinkFlow-text text-base">Idea Buffet</div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateIdeasBuffet();
              }}
              className="flex gap-2 mb-4"
            >
              <TextInput
                variant="custom"
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                placeholder={
                  rootNode?.data?.label ? `Ex: ${rootNode.data.label.slice(0, 30)}...` : 'New idea topic...'
                }
                className="flex-1"
              />
              <Button 
                variant="custom"
                size="default"
                className="bg-thinkFlow-accent"
                type="submit"
                disabled={isGeneratingIdeasBuffet}
              >
                {isGeneratingIdeasBuffet ? 'Generating...' : 'Generate'}
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 h-64">
              {ideaBuffet.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-8">No ideas yet — start generating!</p>
              )}

              <ul className="space-y-3">
                {ideaBuffet.map((idea, idx) => (
                  <li
                    key={`buffet-${idx}`}
                    className="transition-all cursor-grab duration-300 p-3 rounded-lg hover:shadow-lg text-sm bg-gray-700/90 hover:bg-thinkFlow-accent"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(idea));
                    }}
                  >
                    <p className="font-semibold text-thinkFlow-text mb-1">{idea.title}</p>
                    <p className="text-thinkFlow-textSecondary mb-2 text-xs whitespace-pre-line break-words">
                      {idea.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {nodes.map((node) => (
                        <Button
                          key={`${node.id}-${idx}`}
                          onClick={() => handleAddIdeaToNode(node.id, idea)}
                          variant="custom"
                          size="small"
                          title={`Add to ${node.data?.label ?? 'Unnamed node'}`}
                          className="text-xs bg-gray-700/90"
                        >
                          {truncate(node.data?.label)}
                        </Button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
          isExpanded 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg' 
            : 'bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20'
        }`}
        title="Idea Buffet"
      >
        <LightbulbIcon fontSize="small" />
      </button>
    </div>
  );
}; 