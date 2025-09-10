import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DownloadIcon, PrintIcon, WarningIcon } from '../common/icons';
import './JobPDFPreview.css';
import AccessibleModal from '../common/AccessibleModal';

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
  const [showLinePricing, setShowLinePricing] = useState(true);
  const pdfUrlRef = useRef<string | null>(null);

  const loadPDF = useCallback(async () => {
    const TIMEOUT_MS = 15000;
    let timeoutId: number | undefined;

    try {
      setLoading(true);
      setError(null);

      // Clean up previous blob URL if exists (use ref to avoid re-renders)
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
        setPdfUrl(null);
      }

      const token = localStorage.getItem('authToken');
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`/api/jobs/${jobId}/pdf?showLinePricing=${showLinePricing}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText || 'Error';
        if (status === 401 || status === 403) {
          throw new Error('Unauthorized. Please log in again.');
        }
        // Try to read error body for more context (best-effort)
        const detail = await response.text().then(t => t).catch(() => '');
        const message = detail ? `${status} ${statusText} – ${detail}` : `${status} ${statusText}`;
        throw new Error(`Failed to load PDF (${message})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      pdfUrlRef.current = url;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError(`Request timed out after ${Math.round(TIMEOUT_MS / 1000)}s. Please try again.`);
      } else {
        const msg = err?.message || 'Failed to load PDF preview';
        setError(msg);
      }
      console.error('Error loading PDF:', err);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [jobId, showLinePricing]);

  useEffect(() => {
    if (isOpen && jobId) {
      loadPDF();
    }

    // Cleanup blob URL when component unmounts or modal closes
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [isOpen, jobId, showLinePricing, loadPDF]);

  // loadPDF is useCallback above

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
    } catch (_e) {
      console.error('Error downloading PDF:');
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
        } catch (_e) {
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
        } catch (_e) {
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
            } catch (_e) {
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
    } catch (_e) {
      console.error('Error printing PDF');
      alert('Print failed. Please use the built-in PDF print button or your browser\'s print function (Ctrl+P)');
    }
  };

  const handleTogglePricing = () => {
    setShowLinePricing(!showLinePricing);
  };

  if (!isOpen) return null;

  const titleId = 'job-pdf-preview-title';

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} labelledBy={titleId} overlayClassName="pdf-preview-overlay" contentClassName="pdf-preview-modal">
        <div className="pdf-preview-header">
          <h2 id={titleId}>Job PDF Preview</h2>
          <div className="pdf-preview-actions">
            <label className="pdf-pricing-toggle">
              <input
                type="checkbox"
                checked={showLinePricing}
                onChange={handleTogglePricing}
                disabled={loading}
              />
              Show line item pricing
            </label>
            <button 
              className="pdf-action-button download"
              onClick={handleDownload}
              disabled={loading || !!error}
              title="Download PDF"
            >
              <span className="icon"><DownloadIcon width={16} height={16} /></span>
              Download
            </button>
            <button 
              className="pdf-action-button print"
              onClick={handlePrint}
              disabled={loading || !!error}
              title="Print PDF"
            >
              <span className="icon"><PrintIcon width={16} height={16} /></span>
              Print
            </button>
            <button 
              className="pdf-preview-close"
              onClick={onClose}
              title="Close preview"
              aria-label="Close dialog"
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
              <span className="error-icon"><WarningIcon width={20} height={20} /></span>
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
    </AccessibleModal>
  );
};

export default JobPDFPreview;
