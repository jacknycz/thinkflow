// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Button, TextInput } from 'pres-start-core';
// import LightbulbIcon from '@mui/icons-material/Lightbulb';
// import CloseIcon from '@mui/icons-material/Close';
// import { useNodesStore } from '../hooks/useNodesStore';
// import { generateIdeaBuffet } from '../utils/aiProvider';
// import { GenerateIdeasButton } from './GenerateIdeasButton';
// import { AddToNodeButton } from './AddToNodeButton';

// export default function IdeaBuffet() {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [prompt, setPrompt] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);

//   const addNode = useNodesStore((state) => state.addNode);
//   const removeIdeaFromBuffet = useNodesStore((state) => state.removeIdeaFromBuffet);
//   const setIdeaBuffet = useNodesStore((state) => state.setIdeaBuffet);
//   const ideaBuffet = useNodesStore((state) => state.ideaBuffet);
//   const nodes = useNodesStore((state) => state.nodes);
//   const rootNode = useNodesStore((state) => state.getRootNode());
//   const aiProvider = useNodesStore((state) => state.aiProvider);
//   const aiModel = useNodesStore((state) => state.aiModel);

//   const generateIdeas = async () => {
//     const basePrompt = prompt.trim() || rootNode?.data?.label;
//     if (!basePrompt) return;
//     setPrompt('');
//     setIsGenerating(true);
//     window.dispatchEvent(new CustomEvent('ai-thinking-start'));
//     try {
//       const ideas = await generateIdeaBuffet({ 
//         userPrompt: basePrompt, 
//         rootNode: rootNode?.data?.label || '', 
//         numberOfIdeas: 5,
//         provider: aiProvider,
//         model: aiModel
//       });
//       const ideaObjects = (ideas || []).map((idea) => ({ title: idea, summary: '' }));
//       setIdeaBuffet(ideaObjects);
//     } catch (error) {
//       console.error('Error generating ideas:', error);
//     } finally {
//       setIsGenerating(false);
//       window.dispatchEvent(new CustomEvent('ai-thinking-end'));
//     }
//   };

//   const handleAddIdeaToNode = (nodeId, idea) => {
//     const parentNode = nodes.find(n => n.id === nodeId);
//     const extraData = parentNode && parentNode.id !== 'root'
//       ? { nodeColor: parentNode.data?.nodeColor }
//       : {};
//     addNode(nodeId, `${idea.title}`, idea.summary, null, extraData);
//     removeIdeaFromBuffet(idea.title);
//   };

//   const truncate = (text, maxLength = 20) => {
//     if (!text) return '';
//     return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
//   };

//   return (
//     <div className="absolute top-4 right-36 z-50">
//       <AnimatePresence>
//         {isExpanded ? (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="w-80 h-96 bg-black/30 rounded-xl p-3 glass-morphism-dark border border-white/10 shadow-2xl"
//           >
//             <div className="flex justify-between items-center mb-3">
//               <div className="font-bold text-thinkFlow-text text-base">Idea Buffet</div>
//               <button
//                 onClick={() => setIsExpanded(false)}
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 <CloseIcon />
//               </button>
//             </div>

//             <form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 generateIdeas();
//               }}
//               className="flex gap-2 mb-4"
//             >
//               <TextInput
//                 variant="custom"
//                 value={prompt}
//                 onChange={(e) => setPrompt(e.target.value)}
//                 placeholder={
//                   rootNode?.data?.label ? `Ex: ${rootNode.data.label.slice(0, 30)}...` : 'New idea topic...'
//                 }
//                 className="flex-1"
//               />
//               <GenerateIdeasButton 
//                 onClick={generateIdeas}
//                 disabled={!prompt.trim()}
//                 loading={isGenerating}
//               />
//             </form>

//             <div className="flex-1 overflow-y-auto space-y-3 h-64">
//               {ideaBuffet.length === 0 && (
//                 <p className="text-sm text-gray-400 text-center mt-8">No ideas yet — start generating!</p>
//               )}

//               <ul className="space-y-3">
//                 {ideaBuffet.map((idea, idx) => (
//                   <li
//                     key={`buffet-${idx}`}
//                     className="transition-all cursor-grab duration-300 p-3 rounded-lg hover:shadow-lg text-sm glass-morphism hover:glass-morphism-accent"
//                     draggable
//                     onDragStart={(e) => {
//                       e.dataTransfer.setData('application/json', JSON.stringify(idea));
//                     }}
//                   >
//                     <p className="font-semibold text-thinkFlow-text mb-1">{idea.title}</p>
//                     <p className="text-thinkFlow-textSecondary mb-2 text-xs whitespace-pre-line break-words">
//                       {idea.summary}
//                     </p>
//                     <div className="flex flex-wrap gap-1 justify-end">
//                       {nodes.map((node) => (
//                         <AddToNodeButton
//                           key={`${node.id}-${idx}`}
//                           nodeId={node.id}
//                           nodeLabel={node.data?.label}
//                           onClick={handleAddIdeaToNode}
//                         />
//                       ))}
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </motion.div>
//         ) : (
//           <motion.button
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             onClick={() => setIsExpanded(true)}
//             className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 glass-morphism-accent border border-white/20 flex items-center justify-center"
//           >
//             <LightbulbIcon />
//           </motion.button>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// } 