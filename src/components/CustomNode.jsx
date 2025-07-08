import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { IconButton, Tooltip, Button, Modal, TextArea } from 'pres-start-core';
import AddIcon from '@mui/icons-material/Add';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NodeToolbarPin from './NodeToolbarPin';
import NodeToolbarAdd from './NodeToolbarAdd';
import { useNodesStore } from '../hooks/useNodesStore';
import { uploadFile, getFileUrl, storeChunkEmbedding, searchSimilarContent } from '../utils/supabase';
import { getOpenAIEmbedding, generatePromptWithContext, generateSingleIdea } from '../utils/aiProvider';
import { PDFProcessor } from '../utils/pdfProcessor';

import { useReactFlow } from 'reactflow';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import SimpleEditorToolbar from './SimpleEditorToolbar';
import NodeBottomToolbar from './NodeBottomToolbar';
import FilePreview from './FilePreview';

export default function CustomNode({ id, data, addNode, updateNode = () => { }, nodes }) {
  const [hovered, setHovered] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [promptText, setPromptText] = useState('');
  const reactFlowInstance = useReactFlow();

  const pinnedNodeIds = useNodesStore((state) => state.pinnedNodeIds);
  const activeRootId = useNodesStore((state) => state.activeRootId);
  const pinNode = useNodesStore(s => s.pinNode);
  const unpinNode = useNodesStore(s => s.unpinNode);
  const deleteNode = useNodesStore((state) => state.deleteNode);

  // Use robust split for title and summary from label
  const { title, summary } = splitTitleSummary(data.label || '');

  const isPinned = pinnedNodeIds.includes(id);

  const [noteHtml, setNoteHtml] = useState(data.note || '');
  // TipTap editor instance for note modal
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Underline
    ],
    content: noteHtml,
    onUpdate: ({ editor }) => {
      setNoteHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] p-2 rounded-b border border-gray-200 focus:outline-none bg-white',
      },
    },
  });
  const handleSaveNote = () => {
    updateNode(id, { note: noteHtml });
    setShowNoteModal(false);
  };
  const handleNoteModalOpen = () => {
    setNoteHtml(data.note || '');
    setShowNoteModal(true);
    setTimeout(() => {
      if (editor) editor.commands.setContent(data.note || '');
    }, 0);
  };

  // Helper to clamp title to 10 words or 60 chars
  function clampTitle(title) {
    const words = title.split(' ');
    if (words.length > 10) {
      return words.slice(0, 10).join(' ') + '…';
    }
    if (title.length > 60) {
      return title.slice(0, 60) + '…';
    }
    return title;
  }

  function clampTitleAndSummary(title, summary) {
    // Clamp to 14 words, or up to 140 chars but never in the middle of a word
    const words = title.split(' ');
    if (words.length > 14) {
      return {
        title: words.slice(0, 14).join(' ') + '…',
        summary: (words.slice(14).join(' ') + (summary ? ' ' + summary : '')).trim(),
      };
    }
    if (title.length > 140) {
      // Find the last space before 140 chars
      let cutoff = title.lastIndexOf(' ', 140);
      if (cutoff === -1) cutoff = 140; // fallback if no space found
      return {
        title: title.slice(0, cutoff) + '…',
        summary: (title.slice(cutoff).trim() + (summary ? ' ' + summary : '')).trim(),
      };
    }
    return { title, summary };
  }

  function splitTitleSummary(text) {
    if (!text) return { title: '', summary: '' };

    // 1. Split on Explanation: or Summary:
    const explanationMatch = text.match(/^(.*?)(?:Explanation:|Summary:)(.*)$/is);
    if (explanationMatch) {
      let title = explanationMatch[1].trim();
      let summary = explanationMatch[2].trim();
      return clampTitleAndSummary(title, summary);
    }

    // 2. Split on first newline
    const newlineIdx = text.indexOf('\n');
    if (newlineIdx > 0) {
      let title = text.slice(0, newlineIdx).trim();
      let summary = text.slice(newlineIdx + 1).trim();
      return clampTitleAndSummary(title, summary);
    }

    // 3. Split on first period (.)
    const periodIdx = text.indexOf('. ');
    if (periodIdx > 0) {
      let title = text.slice(0, periodIdx + 1).trim();
      let summary = text.slice(periodIdx + 1).trim();
      return clampTitleAndSummary(title, summary);
    }

    // 4. Try to split on colon
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < 60) {
      let title = text.slice(0, colonIdx + 1).trim();
      let summary = text.slice(colonIdx + 1).trim();
      return clampTitleAndSummary(title, summary);
    }

    // 5. Fallback: clamp title to 10 words or 60 chars, summary is the rest
    return clampTitleAndSummary(text, '');
  }

  // Helper for AI Thought
  const handleGenerateAIThought = async () => {
    setAiLoading(true);
    setShowAddMenu(false);
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    try {
      // Use the activeRootId from the store (which is set by pinning)
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
      
      // Get AI provider/model from global state
      const aiProvider = useNodesStore.getState().aiProvider;
      const aiModel = useNodesStore.getState().aiModel;
      
      const ideaText = await generateSingleIdea({
        rootNode,
        parentNodes,
        currentNode,
        promptType: 'idea',
        provider: aiProvider,
        model: aiModel,
      });
      if (ideaText && typeof ideaText === 'string') {
        // Robustly split into title and summary
        const { title: aiTitle, summary: aiSummary } = splitTitleSummary(ideaText);
        const fullLabel = aiTitle + (aiSummary ? `\n${aiSummary}` : '');
        const currentNodeObj = reactFlowInstance.getNode(id);
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
        addNode(id, fullLabel, '', newPosition, {
          sourceHandle,
          targetHandle,
          parentId: id,
        });
      }
    } catch (error) {
      console.error('Error generating AI idea:', error);
    } finally {
      setAiLoading(false);
      window.dispatchEvent(new CustomEvent('ai-thinking-end'));
    }
  };

  // Determine blur/focus state for visual pinning
  const shouldBlur = pinnedNodeIds.length > 0 && !pinnedNodeIds.includes(id);
  const isFocus = pinnedNodeIds.length > 0 && pinnedNodeIds.includes(id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');

  // Handler for Blank Node button
  const handleBlankNode = () => {
    setNewTitle('');
    setNewSummary('');
    setShowAddModal(true);
    setShowAddMenu(false);
  };
  const handleConfirmAdd = () => {
    const label = newTitle.trim();
    const summary = newSummary.trim();
    if (label) {
      const fullLabel = label + (summary ? `\n${summary}` : '');
      const currentNodeObj = reactFlowInstance.getNode(id);
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
      addNode(id, fullLabel, '', newPosition, {
        sourceHandle,
        targetHandle,
        parentId: id
      });
    }
    setShowAddModal(false);
  };

  // Updated file upload handler with PDF support
  const handleFileUpload = async (files) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
        alert(`File ${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        let fileData, chunks, fileType;

        // Handle PDF files
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          fileType = 'pdf';
          
          // Extract text from PDF
          const pdfResult = await PDFProcessor.extractTextFromPDF(file);
          
          if (!pdfResult.success) {
            alert(`Failed to process PDF ${file.name}: ${pdfResult.error}`);
            continue;
          }

          // Upload PDF file to Supabase
          fileData = await uploadFile(file, id);
          
          // Add PDF metadata
          fileData.pdfMetadata = pdfResult.metadata;
          fileData.totalPages = pdfResult.totalPages;
          fileData.totalWords = pdfResult.totalWords;
          
          // Chunk the extracted text
          chunks = PDFProcessor.chunkTextBySections(pdfResult.text).map((content, i) => ({
            fileName: file.name,
            fileType: 'pdf',
            fileIndex: i,
            content,
            uploadedAt: Date.now(),
            pageInfo: `Extracted from PDF (${pdfResult.totalPages} pages)`
          }));

        } else {
          // Handle existing text file types
          fileType = file.name.split('.').pop().toLowerCase();
          
          // Read file as text
          const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });

          // Chunk the file
          chunks = chunkFileContent(text, fileType);
          
          // Upload file to Supabase
          fileData = await uploadFile(file, id);
          
          // Map chunks to our format
          chunks = chunks.map((content, i) => ({
            fileName: file.name,
            fileType: fileType,
            fileIndex: i,
            content,
            uploadedAt: Date.now(),
          }));
        }

        // Store metadata and chunks in node data
        const existingFiles = data.files || [];
        const existingChunks = data.fileChunks || [];
        
        updateNode(id, {
          files: [...existingFiles, fileData],
          fileChunks: [...existingChunks, ...chunks],
        });

        // Embed and store each chunk in Supabase
        for (let i = 0; i < chunks.length; i++) {
          const content = chunks[i].content;
          try {
            const embedding = await getOpenAIEmbedding(content);
            await storeChunkEmbedding({
              nodeId: id,
              fileName: file.name,
              chunkIndex: i,
              content,
              embedding,
            });
          } catch (embedErr) {
            console.error('Embedding error for chunk', i, embedErr);
          }
        }

      } catch (error) {
        alert('Upload failed: ' + error.message);
      }
    }
  };

  // File download/view handler
  const handleFileClick = (fileData) => {
    window.open(fileData.publicUrl || getFileUrl(fileData.supabasePath), '_blank');
  };

  const [showFilesMenu, setShowFilesMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Helper function to chunk file content
  function chunkFileContent(text, type) {
    if (type === 'md' || text.includes('#')) {
      // Split by headings or double newlines
      return text.split(/\n(?=#|##|###|####|#####|######|\n\n)/g).map(s => s.trim()).filter(Boolean);
    } else if (type === 'txt') {
      // Split by double newlines or every ~500 chars
      let paras = text.split(/\n\n+/g).map(s => s.trim()).filter(Boolean);
      if (paras.length < 2 && text.length > 600) {
        // fallback: chunk by 500 chars
        paras = text.match(/.{1,500}/gs) || [];
      }
      return paras;
    } else if (type === 'json') {
      return [text]; // treat as one chunk for now
    } else if (type === 'csv') {
      return [text]; // treat as one chunk for now
    }
    return [text];
  }

  // Helper for Prompt with vector search
  const handlePrompt = async () => {
    setShowAddMenu(false);
    setShowPromptModal(true);
  };

  const handlePromptSubmit = async () => {
    if (!promptText.trim()) return;
    
    setAiLoading(true);
    setShowPromptModal(false);
    window.dispatchEvent(new CustomEvent('ai-thinking-start'));
    
    try {
      // Get node context
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

      // Get vector search results
      let vectorResults = [];
      try {
        const queryEmbedding = await getOpenAIEmbedding(promptText);
        vectorResults = await searchSimilarContent(queryEmbedding, 3);
      } catch (error) {
        console.warn('Vector search failed, continuing without context:', error);
      }

      // Get AI provider/model from global state
      const aiProvider = useNodesStore.getState().aiProvider;
      const aiModel = useNodesStore.getState().aiModel;

      // Generate response with context
      const response = await generatePromptWithContext({
        userPrompt: promptText,
        rootNode,
        parentNodes,
        currentNode,
        vectorResults,
        temperature: 0.7,
        provider: aiProvider,
        model: aiModel,
      });

      if (response && typeof response === 'string') {
        // Create a new node with the response
        const { title: responseTitle, summary: responseSummary } = splitTitleSummary(response);
        const fullLabel = responseTitle + (responseSummary ? `\n${responseSummary}` : '');
        
        const currentNodeObj = reactFlowInstance.getNode(id);
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
        
        addNode(id, fullLabel, '', newPosition, {
          sourceHandle,
          targetHandle,
          parentId: id,
        });
      }
    } catch (error) {
      console.error('Error generating prompt response:', error);
    } finally {
      setAiLoading(false);
      setPromptText('');
      window.dispatchEvent(new CustomEvent('ai-thinking-end'));
    }
  };

  // Update the files submenu to include preview functionality
  const renderFilesMenu = () => (
    <div
      className={`absolute left-1/2 -translate-x-1/2 top-full mt-0 min-w-[200px] rounded-lg bg-gray-800/90 text-gray-100 shadow-xl transition-all z-50 ${
        showFilesMenu ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{ paddingTop: 0 }}
      onMouseEnter={() => setShowFilesMenu(true)}
      onMouseLeave={() => setShowFilesMenu(false)}
    >
      {data.files.map((file, idx) => (
        <div
          key={file.supabasePath || file.name + idx}
          className={`block w-full text-left px-4 py-2 bg-gray-800/80 hover:bg-gray-700 cursor-pointer ${
            idx === 0 ? 'rounded-t-lg' : ''
          } ${idx === data.files.length - 1 ? 'rounded-b-lg' : ''}`}
          style={{ color: data.nodeColor }}
        >
          <div className="flex items-center justify-between">
            <span className="truncate flex-1">{file.name}</span>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewFile(file);
                  setShowFilePreview(true);
                  setShowFilesMenu(false);
                }}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                title="Preview"
              >
                👁️
              </button>
              <a
                href={file.publicUrl || getFileUrl(file.supabasePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                title="Open"
                onClick={(e) => e.stopPropagation()}
              >
                ↗️
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`relative p-5 rounded-3xl  max-w-lg min-w-[340px] transition-all duration-300 glassy-node ${shouldBlur ? 'node-blur' : isFocus ? 'node-focus' : ''}`}
      style={{
        background: `radial-gradient(circle, rgba(255, 255, 255, 0.5) 10%, ${data.nodeColor || '#e5e7eb'}60 100%)`,
        // border: `1px solid ${data.nodeColor || '#e5e7eb'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowAddMenu(false); }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      {/* Focus/Pin Button (top right) - only show when no nodes pinned OR when this node is pinned */}
      {pinnedNodeIds.length === 0 || isPinned ? (
        <div className="absolute -top-3 -right-3 z-10">
          <Tooltip content={isPinned ? 'Unpin' : 'Focus'} position="left">
            <IconButton
              size="small"
              variant="custom"
              className={`bg-gray-800/90 border transition-all duration-200 ${isPinned
                  ? 'border border-blue-400 shadow-lg shadow-blue-400/50'
                  : 'border border-white/60'
                }`}
              shape="circle"
              onClick={e => {
                e.stopPropagation();
                isPinned ? unpinNode() : pinNode(id);
              }}
            >
              <CenterFocusStrongIcon fontSize="small" className="text-p-400" />
            </IconButton>
          </Tooltip>
        </div>
      ) : null}

      {/* Title with attachment indicator and menu */}
      <div className="flex items-start gap-2 mb-1 pb-2 relative">
        <h3 className={`font-semibold text-lg leading-tight line-clamp-2 flex-1`} style={{ color: data.nodeColor }}>{title}</h3>
        {data.files && data.files.length > 0 && (
          <div className="relative flex items-center">
            <div
              className="flex items-center gap-1 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
              style={{ color: data.nodeColor }}
              onClick={() => setShowFilesMenu(v => !v)}
              onMouseEnter={() => setShowFilesMenu(true)}
              onMouseLeave={() => setShowFilesMenu(false)}
            >
              <AttachFileIcon fontSize="small" />
              <span>{data.files.length}</span>
            </div>
            {renderFilesMenu()}
          </div>
        )}
      </div>
      {/* Divider (only if summary) */}
      {summary && <div className="border-t border-white/20 my-2" />}
      {/* Summary */}
      {summary && (
        <p className={`whitespace-pre-wrap font-normal text-sm mb-3`} style={{ color: data.nodeColor }}>{summary}</p>
      )}

      {/* Toolbar (bottom) */}
      <div className="mt-2">
        <NodeBottomToolbar
          onAddClick={e => { e.stopPropagation(); setShowAddMenu(v => !v); }}
          onAddMenuEnter={() => setShowAddMenu(true)}
          onAddMenuLeave={() => setShowAddMenu(false)}
          showAddMenu={showAddMenu}
          aiLoading={aiLoading}
          handleGenerateAIThought={handleGenerateAIThought}
          handleAddNode={type => {
            if (type === 'Blank Node') {
              handleBlankNode();
            } else {
              addNode(id, type, '', {}, {});
              setShowAddMenu(false);
            }
          }}
          handlePrompt={handlePrompt}
          handleNoteClick={e => { e.stopPropagation(); handleNoteModalOpen(); }}
          handleFileUpload={handleFileUpload}
          handleDeleteClick={e => { e.stopPropagation(); deleteNode(id); }}
          canDelete={id !== 'root'}
        />
      </div>

      {/* Note Modal with TipTap editor and toolbar */}
      <Modal variant="custom" className="w-full min-w-[400px] max-w-2xl text-thinkFlow-text" isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add/Edit Note">
        <h3 className="text-lg font-semibold mb-4 text-white truncate max-w-full">
          "{title}" Note
        </h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded">
            <SimpleEditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          <div className="text-xs text-white">You can format text and add links. (No images supported.)</div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowNoteModal(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNote}>
            Save Note
          </Button>
        </div>
      </Modal>

      {/* Add Idea Modal for Blank Node */}
      <Modal variant="custom" className="w-full min-w-96 max-w-md text-thinkFlow-text" isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Idea">
        <div className="space-y-4">
          <input
            className="w-full border rounded px-3 py-2 text-base"
            placeholder="New idea title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2 text-base"
            placeholder="Optional summary"
            rows={2}
            value={newSummary}
            onChange={e => setNewSummary(e.target.value)}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowAddModal(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmAdd}>
            Add Idea
          </Button>
        </div>
      </Modal>

      {/* Prompt Modal */}
      <Modal variant="custom" className="w-full min-w-[500px] max-w-2xl text-thinkFlow-text" isOpen={showPromptModal} onClose={() => setShowPromptModal(false)} title="Ask AI with Context">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Your prompt (will be enhanced with node context and uploaded files):
            </label>
            <TextArea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask anything about this topic or related to your uploaded files..."
              rows={4}
              className="w-full"
            />
          </div>
          <div className="text-xs text-gray-300">
            💡 The AI will prioritize your uploaded files and node context over general knowledge.
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowPromptModal(false)} className="mr-2">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePromptSubmit}
            disabled={!promptText.trim() || aiLoading}
          >
            {aiLoading ? 'Generating...' : 'Ask AI'}
          </Button>
        </div>
      </Modal>

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        isOpen={showFilePreview}
        onClose={() => {
          setShowFilePreview(false);
          setPreviewFile(null);
        }}
        nodeColor={data.nodeColor}
      />
    </div>
  );
}
