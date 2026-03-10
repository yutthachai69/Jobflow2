'use client';

import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
  icon?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  variant = 'primary',
  icon = '❓'
}: ConfirmModalProps) {

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const confirmBtnClass = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  }[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Top accent */}
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-600'}`} />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="text-5xl mb-5">{icon}</div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">{title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed mb-8">{description}</p>

          {/* Buttons - stacked for safety */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${confirmBtnClass}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for programmatic usage
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger" | "warning";
    icon?: string;
  } | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = async (opts: {
    title: string;
    message?: string; // backwards compatibility
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger" | "warning" | "info"; // allow info
    icon?: string;
  }) => {
    // map info to primary, map message to description
    setOptions({
      title: opts.title,
      description: opts.description || opts.message || '',
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      variant: (opts.variant === 'info' ? 'primary' : opts.variant) as "primary" | "danger" | "warning",
      icon: opts.icon
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.resolve(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    resolver?.resolve(false);
  };

  const ConfirmDialog = () => {
    if (!isOpen || !options) return null;
    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        icon={options.icon}
      />
    );
  };

  return { confirm, ConfirmDialog };
}

