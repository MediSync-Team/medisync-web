'use client';

import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  footer?: React.ReactNode;
  closeLabel?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[90vh]',
  footer,
  closeLabel = 'Cerrar modal',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${maxWidth} ${maxHeight} overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{title}</h3>
          <button
            aria-label={closeLabel}
            onClick={onClose}
            className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
