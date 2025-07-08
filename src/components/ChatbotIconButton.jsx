import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextInput, Button } from 'pres-start-core';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useNodesStore } from '../hooks/useNodesStore';
import { generatePromptWithContext } from '../utils/aiProvider';

export const ChatbotIconButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: 'Hi! I can answer questions about your current canvas, nodes, and documents. Ask me anything!',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get context from store
  const nodes = useNodesStore((state) => state.nodes);
  const aiProvider = useNodesStore((state) => state.aiProvider);
  const aiModel = useNodesStore((state) => state.aiModel);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    setMessages((msgs) => [
      ...msgs,
      { role: 'user', content: trimmed, timestamp: Date.now() },
    ]);
    setInputMessage('');
    setIsLoading(true);
    try {
      // Find the active root node and its parents
      const rootNode = nodes.find((n) => n.id === 'root');
      const parentNodes = [];
      let current = rootNode;
      while (current && current.data && current.data.parentId && current.data.parentId !== 'root') {
        const parent = nodes.find((n) => n.id === current.data.parentId);
        if (parent) {
          parentNodes.unshift(parent.data.label);
          current = parent;
        } else {
          break;
        }
      }

      const contextRoot = rootNode?.data?.label || '';
      const contextCurrent = rootNode?.data?.label || '';
      const aiResponse = await generatePromptWithContext({
        userPrompt: trimmed,
        rootNode: contextRoot,
        parentNodes,
        currentNode: contextCurrent,
        provider: aiProvider,
        model: aiModel,
      });
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: aiResponse, timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Sorry, there was an error getting a response.', timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-full right-0 mt-2 w-80 h-96 bg-gray-800/90 rounded-xl p-3 border border-gray-600 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-thinkFlow-text text-base">💬 Chatbot</div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 h-64">
              {messages.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow bg-gray-700/90 ${message.role === 'user' ? 'bg-thinkFlow-accent text-white' : 'bg-white/10 text-thinkFlow-text'}`}>
                    <div>{message.content}</div>
                    <div className="text-xs text-gray-400 mt-1 text-right">{formatTimestamp(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="flex gap-2 mt-auto" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
              <TextInput
                variant="custom"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your canvas, nodes, or ideas..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                variant="custom"
                size="default"
                className="bg-thinkFlow-accent"
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
              >
                <SendIcon />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <button
        onClick={() => {
          console.log('🔍 Chatbot button clicked, current state:', isExpanded);
          setIsExpanded(!isExpanded);
        }}
        className={`w-12 h-12 rounded-full hover:bg-sky-500 flex items-center justify-center transition-all duration-200 ${
          isExpanded 
            ? 'bg-sky-500 text-white shadow-lg' 
            : 'bg-slate-900/90 backdrop-blur-sm'
        }`}
        title="Chatbot"
      >
        <ChatIcon fontSize="small" />
      </button>
    </div>
  );
}; 