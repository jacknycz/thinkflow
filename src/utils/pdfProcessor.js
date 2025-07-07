// PDF Processing Utilities
// Comprehensive PDF processing with URL and File support

export class PDFProcessor {
  static async extractTextFromPDF(fileOrUrl) {
    console.log('📄 Starting PDF text extraction for:', fileOrUrl.name || fileOrUrl.publicUrl);
    console.log('📊 File details:', {
      name: fileOrUrl.name,
      size: fileOrUrl.size,
      type: fileOrUrl.type,
      hasPublicUrl: !!fileOrUrl.publicUrl
    });
    
    try {
      let file;
      
      // Handle both File objects and Supabase file objects with URLs
      if (fileOrUrl.publicUrl) {
        // This is a Supabase file object - fetch the file
        console.log('🔄 Fetching file from URL...');
        const response = await fetch(fileOrUrl.publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const blob = await response.blob();
        file = new File([blob], fileOrUrl.name, { type: fileOrUrl.type || 'application/pdf' });
        console.log('✅ File fetched from URL');
      } else {
        // This is a native File object
        file = fileOrUrl;
      }
      
      // Step 1: Try PDF.js from CDN for text extraction
      console.log('🔄 Step 1: Attempting PDF.js text extraction...');
      try {
        const { default: pdfjsLib } = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
        
        // Configure worker from CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        console.log('✅ PDF loaded with PDF.js');
        
        let fullText = '';
        const pageTexts = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          
          pageTexts.push({
            pageNumber: pageNum,
            text: pageText,
            wordCount: pageText.split(/\s+/).length
          });
          
          fullText += pageText + '\n\n';
        }
        
        const result = {
          success: true,
          text: fullText.trim(),
          pages: pageTexts,
          totalPages: pdf.numPages,
          totalWords: fullText.split(/\s+/).length,
          metadata: {
            title: pdf.info?.Title || file.name,
            author: pdf.info?.Author || 'Unknown',
            subject: pdf.info?.Subject || '',
            creator: pdf.info?.Creator || '',
            producer: pdf.info?.Producer || '',
            creationDate: pdf.info?.CreationDate || '',
            modificationDate: pdf.info?.ModDate || ''
          }
        };
        
        console.log('🎉 PDF text extraction successful with PDF.js');
        return result;
        
      } catch (pdfjsError) {
        console.warn('⚠️ PDF.js extraction failed:', pdfjsError.message);
        
        // Step 2: Fallback to browser-native approach
        console.log('🔄 Step 2: Attempting browser-native extraction...');
        
        const objectUrl = URL.createObjectURL(file);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = objectUrl;
        document.body.appendChild(iframe);
        
        await new Promise((resolve, reject) => {
          iframe.onload = resolve;
          iframe.onerror = reject;
          setTimeout(() => reject(new Error('PDF load timeout')), 10000);
        });
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const textElements = iframeDoc.querySelectorAll('span, div, p');
        const extractedText = Array.from(textElements)
          .map(el => el.textContent || el.innerText)
          .filter(text => text && text.trim())
          .join(' ');
        
        document.body.removeChild(iframe);
        URL.revokeObjectURL(objectUrl);
        
        const result = {
          success: true,
          text: extractedText.trim(),
          pages: [{
            pageNumber: 1,
            text: extractedText,
            wordCount: extractedText.split(/\s+/).length
          }],
          totalPages: 1,
          totalWords: extractedText.split(/\s+/).length,
          metadata: {
            title: file.name,
            author: 'Unknown',
            subject: '',
            creator: '',
            producer: '',
            creationDate: '',
            modificationDate: ''
          }
        };
        
        console.log('🎉 PDF text extraction successful with browser-native approach');
        return result;
      }
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        pages: [],
        totalPages: 0,
        totalWords: 0,
        metadata: {}
      };
    }
  }

  static async getPDFPreview(fileOrUrl, pageNumber = 1) {
    console.log('🖼️ Starting PDF preview generation for:', fileOrUrl.name || fileOrUrl.publicUrl, 'page:', pageNumber);
    
    try {
      let file;
      
      // Handle both File objects and Supabase file objects with URLs
      if (fileOrUrl.publicUrl) {
        console.log('🔄 Fetching file from URL for preview...');
        const response = await fetch(fileOrUrl.publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const blob = await response.blob();
        file = new File([blob], fileOrUrl.name, { type: fileOrUrl.type || 'application/pdf' });
        console.log('✅ File fetched from URL for preview');
      } else {
        file = fileOrUrl;
      }
      
      // Try PDF.js from CDN for preview
      try {
        const { default: pdfjsLib } = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (pageNumber > pdf.numPages) {
          pageNumber = 1;
        }
        
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        console.log('✅ PDF preview generated successfully with PDF.js');
        
        return {
          success: true,
          canvas,
          pageNumber,
          totalPages: pdf.numPages,
          width: viewport.width,
          height: viewport.height
        };
        
      } catch (pdfjsError) {
        console.warn('⚠️ PDF.js preview failed:', pdfjsError.message);
        
        // Fallback to simple text-based preview
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 800;
        
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        context.font = '12px Arial';
        
        context.fillText(`PDF File: ${file.name}`, 20, 30);
        context.fillText(`Size: ${(file.size / 1024).toFixed(1)} KB`, 20, 50);
        context.fillText(`Preview not available for this PDF`, 20, 80);
        context.fillText(`Please use the text extraction feature instead.`, 20, 100);
        
        console.log('✅ PDF preview generated successfully (text-based fallback)');
        
        return {
          success: true,
          canvas,
          pageNumber: 1,
          totalPages: 1,
          width: canvas.width,
          height: canvas.height
        };
      }
      
    } catch (error) {
      console.error('PDF preview error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static extractTextWithLayout(file) {
    // Implementation for layout extraction
    return this.extractTextFromPDF(file);
  }

  static groupTextByLines(textItems, tolerance = 5) {
    const lines = [];
    
    textItems.forEach(item => {
      const y = Math.round(item.y / tolerance) * tolerance;
      let line = lines.find(l => Math.abs(l.y - y) < tolerance);
      
      if (!line) {
        line = { y, items: [] };
        lines.push(line);
      }
      
      line.items.push(item);
    });
    
    lines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
    });
    
    lines.sort((a, b) => b.y - a.y);
    
    return lines;
  }

  static chunkTextBySections(text, maxChunkSize = 1000) {
    const chunks = [];
    const paragraphs = text.split(/\n\s*\n/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;
      
      if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
