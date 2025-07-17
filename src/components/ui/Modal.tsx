import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, description, children, className }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-blue-900/40 backdrop-blur-md transition-all duration-300"
        onClick={() => onOpenChange(false)}
        aria-label="Fermer le modal"
      />
      {/* Modal content */}
      <div
        className={`relative z-10 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-auto flex flex-col gap-6 border-0 ${className || ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 rounded-full bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {title && <h2 id="modal-title" className="text-lg leading-none font-semibold">{title}</h2>}
        {description && <p id="modal-desc" className="text-muted-foreground text-sm">{description}</p>}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal; 