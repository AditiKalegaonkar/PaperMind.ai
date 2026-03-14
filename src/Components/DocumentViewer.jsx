import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Svg = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const XIcon = () => <Svg size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const AskIcon = () => <Svg size={14}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
const PrevIcon = () => <Svg size={14}><polyline points="15 18 9 12 15 6"/></Svg>;
const NextIcon = () => <Svg size={14}><polyline points="9 18 15 12 9 6"/></Svg>;
const ZoomInIcon = () => <Svg size={14}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Svg>;
const ZoomOutIcon = () => <Svg size={14}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></Svg>;

export default function DocumentViewer({ file, onAskSelection, onClose, open = true }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionBar, setShowSelectionBar] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [fileType, setFileType] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef(null);

  const handleSelection = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString()?.trim();
      
      if (text && text.length > 0) {
        setSelectedText(text);
        setShowSelectionBar(true);
        
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        } catch (e) {
          setSelectionPosition({ x: window.innerWidth / 2, y: 100 });
        }
      }
    }, 50);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [handleSelection]);

  useEffect(() => {
    if (!file) return;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);
      setPdfData(null);
      setSelectedText('');
      setShowSelectionBar(false);
      setCurrentPage(1);
      setNumPages(0);

      try {
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          setPdfData(arrayBuffer);
          const fileType = file.name?.split('.').pop()?.toLowerCase();
          setFileType(fileType);
        } else if (file.data) {
          setPdfData(file.data);
          setFileType('pdf');
        } else if (typeof file === 'string') {
          if (file.startsWith('blob:')) {
            fetch(file)
              .then(res => res.arrayBuffer())
              .then(data => setPdfData(data));
            setFileType('pdf');
          } else if (file.startsWith('http')) {
            setPdfData(file);
            setFileType('pdf');
          } else if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            setPdfData(null);
            setFileType('image');
          } else {
            throw new Error('Unsupported file type');
          }
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        console.error('Document load error:', err);
        setError('Failed to load document: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleAskSelection = () => {
    const textToAsk = selectedText.trim();
    if (!textToAsk || textToAsk.length === 0) return;
    
    if (onAskSelection) {
      onAskSelection(textToAsk);
      setSelectedText('');
      setShowSelectionBar(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="doc-viewer" style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}>
      <div className="doc-viewer-header">
        <div className="doc-viewer-title">
          <span>{file?.name || 'Document'}</span>
        </div>

        <div className="doc-viewer-controls">
          <button 
            className="doc-ask-btn" 
            onClick={handleAskSelection}
            title="Ask about this document"
            disabled={!selectedText}
          >
            <AskIcon/>
            Ask
          </button>
          {onClose && (
            <button className="doc-close-btn" onClick={handleClose} title="Close">
              <XIcon/>
            </button>
          )}
        </div>
      </div>

      <div className="doc-viewer-body" ref={containerRef}>
        {loading && (
          <div className="doc-loading">
            <span>Loading document...</span>
          </div>
        )}

        {error && (
          <div className="doc-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && fileType === 'pdf' && pdfData && (
          <div className="doc-pdf-wrapper">
            <div className="doc-pdf-toolbar">
              <button onClick={goToPrevPage} disabled={currentPage <= 1} className="toolbar-btn">
                <PrevIcon />
              </button>
              <span className="page-info">{currentPage} / {numPages}</span>
              <button onClick={goToNextPage} disabled={currentPage >= numPages} className="toolbar-btn">
                <NextIcon />
              </button>
              <div className="toolbar-divider" />
              <button onClick={zoomOut} className="toolbar-btn">
                <ZoomOutIcon />
              </button>
              <span className="zoom-info">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="toolbar-btn">
                <ZoomInIcon />
              </button>
            </div>
            <div className="doc-pdf-container">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="doc-loading"><span>Loading PDF...</span></div>}
                error={<div className="doc-error"><span>Failed to load PDF</span></div>}
              >
                <Page 
                  pageNumber={currentPage} 
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onClick={() => {}}
                />
              </Document>
            </div>
          </div>
        )}

        {!loading && !error && fileType === 'image' && (
          <div className="doc-image-container">
            <img 
              src={file instanceof File ? URL.createObjectURL(file) : file} 
              alt="Document" 
              className="doc-image" 
            />
          </div>
        )}
      </div>

      {showSelectionBar && selectedText && (
        <div 
          className="doc-selection-bar"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
          }}
        >
          <span className="doc-selection-preview">
            "{selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText}"
          </span>
          <button className="doc-ask-selection-btn" onClick={handleAskSelection}>
            <AskIcon size={12}/>
            Ask
          </button>
        </div>
      )}
    </div>
  );
}
