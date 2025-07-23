import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import './JobPDFPreview.css';

interface JobPDFPreviewProps {
  jobId: number;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const JobPDFPreview: React.FC<JobPDFPreviewProps> = ({
  jobId,
  jobTitle,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      loadPDF();
    }

    // Cleanup blob URL when component unmounts or modal closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, jobId]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const token = localStorage.getItem('authToken');
      
      // Fetch PDF as blob
      const response = await fetch(`/api/jobs/${jobId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      if (!pdfUrl) {
        alert('PDF not loaded yet');
        return;
      }

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    try {
      if (!pdfUrl) {
        alert('PDF not loaded yet');
        return;
      }

      // Method 1: Try to print the current iframe directly
      const currentIframe = document.querySelector('.pdf-iframe') as HTMLIFrameElement;
      if (currentIframe && currentIframe.contentWindow) {
        try {
          currentIframe.contentWindow.print();
          return; // Success - exit early
        } catch (e) {
          console.log('Direct iframe print failed, trying fallback methods');
        }
      }

      // Method 2: Hidden popup window fallback
      const printWindow = window.open(pdfUrl, '_blank', 'width=1,height=1,left=-9999,top=-9999,menubar=no,toolbar=no,location=no,status=no');
      
      if (printWindow) {
        // Wait for PDF to load, then print and close
        const printAndClose = () => {
          try {
            printWindow.print();
            // Close the hidden window after printing
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 1000);
          } catch (e) {
            console.log('Hidden window print failed');
          }
        };

        // Try multiple approaches to detect when PDF is loaded
        if (printWindow.document) {
          printWindow.addEventListener('load', printAndClose);
        }
        
        // Fallback timer in case load event doesn't fire
        setTimeout(printAndClose, 2000);
      } else {
        // Method 3: Hidden iframe fallback if popups are blocked
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.border = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.print();
            } catch (e) {
              console.log('Hidden iframe print failed');
              alert('Print failed. Please use the built-in PDF print button or your browser\'s print function (Ctrl+P)');
            }
            
            // Clean up iframe
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Print failed. Please use the built-in PDF print button or your browser\'s print function (Ctrl+P)');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pdf-preview-overlay">
      <div className="pdf-preview-modal">
        <div className="pdf-preview-header">
          <h2>Job PDF Preview</h2>
          <div className="pdf-preview-actions">
            <button 
              className="pdf-action-button download"
              onClick={handleDownload}
              disabled={loading || !!error}
              title="Download PDF"
            >
              <span className="icon">⬇️</span>
              Download
            </button>
            <button 
              className="pdf-action-button print"
              onClick={handlePrint}
              disabled={loading || !!error}
              title="Print PDF"
            >
              <span className="icon">🖨️</span>
              Print
            </button>
            <button 
              className="pdf-preview-close"
              onClick={onClose}
              title="Close preview"
            >
              ×
            </button>
          </div>
        </div>

        <div className="pdf-preview-content">
          {loading && (
            <div className="pdf-loading">
              <div className="loading-spinner"></div>
              <p>Loading PDF preview...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={loadPDF} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="pdf-iframe"
              title={`PDF Preview: ${jobTitle}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPDFPreview;