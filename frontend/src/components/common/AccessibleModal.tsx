import React, { useEffect, useRef, useCallback } from 'react';

type AccessibleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string; // id of the heading element
  describedBy?: string; // id of description content
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeOnBackdrop?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

// Utility: Get focusable elements inside a container
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selectors = [
    'a[href]','area[href]','button:not([disabled])','input:not([disabled])',
    'select:not([disabled])','textarea:not([disabled])','iframe','object','embed',
    '*[tabindex]:not([tabindex="-1"])','*[contenteditable=true]'
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')))
    .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
};

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  initialFocusRef,
  closeOnBackdrop = true,
  overlayClassName = 'modal-overlay',
  contentClassName = 'modal-content',
  children,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  // Trap focus within modal
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const container = contentRef.current;
    if (!container) return;
    const focusables = getFocusableElements(container);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // Backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Manage focus on open/close
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const container = contentRef.current;
    const toFocus = initialFocusRef?.current
      || (container ? getFocusableElements(container)[0] : null)
      || container;
    if (toFocus) {
      // If focusing container, ensure it’s focusable
      if (toFocus === container && toFocus.tabIndex < 0) {
        toFocus.tabIndex = -1;
      }
      toFocus.focus();
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleFocusTrap, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      document.removeEventListener('keydown', handleFocusTrap, { capture: true } as any);
      // Restore focus back to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, handleFocusTrap, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className={overlayClassName}
      onClick={handleBackdropClick}
      role="presentation"
      aria-hidden={false}
    >
      <div
        ref={contentRef}
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </div>
    </div>
  );
};

export default AccessibleModal;

