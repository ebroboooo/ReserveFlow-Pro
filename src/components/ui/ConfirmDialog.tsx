import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const btnClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-slate-900 font-medium px-4 py-2.5 rounded-xl transition-all' : 'btn-primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>{cancelLabel}</button>
          <button onClick={onConfirm} className={btnClass} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-50 text-red-600' : variant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
        }`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};
