import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal } from 'pres-start-core';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PDFProcessor } from '../utils/pdfProcessor';

export default function FilePreview({ file, isOpen, onClose, nodeColor }) {
  const [previewContent, setPreviewContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPreview, setPdfPreview] = useState(null);

  useEffect(() => {
    if (isOpen && file) {
      setCurrentPage(1);
      loadPreview();
    }
  }, [isOpen, file]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isPDF(file.type) || isPDF(file.name)) {
        // Handle PDF preview
        const pdfResult = await PDFProcessor.extractTextFromPDF(file);
        
        if (!pdfResult.success) {
          throw new Error(pdfResult.error);
        }

        // Get PDF preview image
        const previewResult = await PDFProcessor.getPDFPreview(file, currentPage);
        
        setPreviewContent({
          type: 'pdf',
          text: pdfResult.text,
          pages: pdfResult.pages,
          metadata: pdfResult.metadata,
          totalPages: pdfResult.totalPages,
          totalWords: pdfResult.totalWords
        });
        
        if (previewResult.success) {
          setPdfPreview(previewResult);
        }
      } else if (isTextFile(file.type) || isTextFile(file.name)) {
        // Handle text files
        const response = await fetch(file.publicUrl);
        const text = await response.text();
        setPreviewContent({ type: 'text', content: text });
      } else {
        setPreviewContent({ type: 'unsupported', content: null });
      }
    } catch (err) {
      setError('Failed to load file preview: ' + err.message);
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isPDF = (typeOrName) => {
    return typeOrName === 'application/pdf' || typeOrName?.toLowerCase().endsWith('.pdf');
  };

  const isTextFile = (typeOrName) => {
    const textTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
    const textExtensions = ['.txt', '.md', '.json', '.csv'];
    
    if (textTypes.includes(typeOrName)) return true;
    return textExtensions.some(ext => typeOrName?.toLowerCase().endsWith(ext));
  };

  const getFileIcon = (fileName) => {
    if (isPDF(fileName)) return <PictureAsPdfIcon />;
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md': return <DescriptionIcon />;
      case 'json': return <CodeIcon />;
      case 'csv': return <TableChartIcon />;
      case 'txt': 
      default: return <TextFieldsIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPDFPreview = () => {
    if (!previewContent || previewContent.type !== 'pdf') return null;

    return (
      <div className="space-y-4">
        {/* PDF Metadata */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">PDF Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-400">Pages:</span> {previewContent.totalPages}</div>
            <div><span className="text-gray-400">Words:</span> {previewContent.totalWords.toLocaleString()}</div>
            {previewContent.metadata.title && (
              <div><span className="text-gray-400">Title:</span> {previewContent.metadata.title}</div>
            )}
            {previewContent.metadata.author && (
              <div><span className="text-gray-400">Author:</span> {previewContent.metadata.author}</div>
            )}
          </div>
        </div>

        {/* PDF Preview Image */}
        {pdfPreview && (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Page {currentPage} Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="custom"
                  size="small"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(prev => prev - 1);
                    setTimeout(() => loadPreview(), 100);
                  }}
                >
                  ←
                </Button>
                <span className="text-sm text-gray-400">
                  {currentPage} / {pdfPreview.totalPages}
                </span>
                <Button
                  variant="custom"
                  size="small"
                  disabled={currentPage >= pdfPreview.totalPages}
                  onClick={() => {
                    setCurrentPage(prev => prev + 1);
                    setTimeout(() => loadPreview(), 100);
                  }}
                >
                  →
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={pdfPreview.canvas.toDataURL()}
                alt={`Page ${currentPage}`}
                className="max-w-full h-auto border border-gray-700 rounded"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </div>
        )}

        {/* Extracted Text */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Extracted Text</h3>
          <div className="max-h-96 overflow-auto">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap">
              {previewContent.text}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderTextPreview = (content, fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    
    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        return (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        return <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto max-h-96 text-sm">{content}</pre>;
      }
    }
    
    if (ext === 'csv') {
      const lines = content.split('\n');
      const headers = lines[0]?.split(',') || [];
      const data = lines.slice(1).filter(line => line.trim());
      
      return (
        <div className="bg-gray-900 rounded-lg overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                {headers.map((header, i) => (
                  <th key={i} className="px-3 py-2 text-left text-gray-300 border-b border-gray-700">
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-700">
                  {row.split(',').map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-gray-300">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (ext === 'md') {
      // Simple markdown rendering
      const formatted = content
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/\n/g, '<br>');
      
      return (
        <div 
          className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto max-h-96 prose prose-invert prose-sm"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }
    
    // Plain text
    return (
      <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto max-h-96 text-sm whitespace-pre-wrap">
        {content}
      </pre>
    );
  };

  return (
    <Modal 
      variant="custom" 
      className="w-full max-w-6xl text-thinkFlow-text" 
      isOpen={isOpen} 
      onClose={onClose}
      title=""
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl" style={{ color: nodeColor }}>
              {getFileIcon(file?.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{file?.name}</h2>
              <p className="text-sm text-gray-400">
                {formatFileSize(file?.size)} • {file?.type || 'Unknown type'}
                {file?.pdfMetadata && ` • ${file.totalPages} pages`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="custom"
              size="small"
              onClick={() => window.open(file?.publicUrl, '_blank')}
            >
              <OpenInNewIcon fontSize="small" />
            </Button>
            <Button
              variant="custom"
              size="small"
              onClick={() => {
                const link = document.createElement('a');
                link.href = file?.publicUrl;
                link.download = file?.name;
                link.click();
              }}
            >
              <DownloadIcon fontSize="small" />
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="border-t border-gray-700 pt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">
                {isPDF(file?.type) || isPDF(file?.name) ? 'Processing PDF...' : 'Loading preview...'}
              </span>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-2">{error}</p>
              <Button
                variant="custom"
                size="small"
                onClick={loadPreview}
              >
                Retry
              </Button>
            </div>
          )}
          
          {!isLoading && !error && previewContent && (
            <div>
              {previewContent.type === 'pdf' ? (
                renderPDFPreview()
              ) : previewContent.type === 'text' ? (
                renderTextPreview(previewContent.content, file?.name)
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2">Preview not available for this file type</p>
                  <Button
                    variant="custom"
                    size="small"
                    onClick={() => window.open(file?.publicUrl, '_blank')}
                  >
                    Open File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
} 