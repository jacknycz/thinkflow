import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectInput } from 'pres-start-core';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloseIcon from '@mui/icons-material/Close';
import { useNodesStore } from '../hooks/useNodesStore';
import { getAvailableProviders } from '../utils/aiProvider';

export default function AIProviderSelector() {
  const [isExpanded, setIsExpanded] = useState(false);

  // AI Provider/Model selection from global state
  const aiProvider = useNodesStore((state) => state.aiProvider);
  const aiModel = useNodesStore((state) => state.aiModel);
  const setAIProviderAndModel = useNodesStore((state) => state.setAIProviderAndModel);

  // Get available providers and models
  const availableProviders = getAvailableProviders();
  const currentProvider = availableProviders.find(p => p.id === aiProvider);
  const currentModels = currentProvider?.models || [];

  return (
    <div className="absolute top-4 right-20 z-50">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-64 bg-black/30 rounded-xl p-3 glass-morphism-dark border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-thinkFlow-text text-base">�� AI Settings</div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  AI Provider
                </label>
                <SelectInput
                  variant="custom"
                  value={aiProvider}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    const providerConfig = availableProviders.find(p => p.id === newProvider);
                    const defaultModel = providerConfig?.models[0]?.id || 'gpt-4o';
                    setAIProviderAndModel(newProvider, defaultModel);
                  }}
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
                  variant="custom"
                  value={aiModel}
                  onChange={(e) => setAIProviderAndModel(aiProvider, e.target.value)}
                >
                  {currentModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 glass-morphism-accent border border-white/20 flex items-center justify-center"
          >
            <PsychologyIcon />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
} 