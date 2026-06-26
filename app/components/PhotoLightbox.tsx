'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface PhotoItem {
  id: string;
  url: string;
  type?: 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER';
  createdAt?: Date;
}

interface PhotoLightboxProps {
  isOpen: boolean;
  photos: PhotoItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PhotoLightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: PhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const photoTypeLabel = {
    BEFORE: 'ก่อน',
    AFTER: 'หลัง',
    DEFECT: 'ข้อบกพร่อง',
    METER: 'มาตรวัด',
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-[10001] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full bg-black rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Image */}
        <div className="flex items-center justify-center bg-black relative" style={{ aspectRatio: '4/3' }}>
          <img
            src={currentPhoto.url}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Info Bar */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-3">
            {currentPhoto.type && (
              <span className="px-2 py-1 bg-blue-600 rounded text-white text-xs font-semibold">
                {photoTypeLabel[currentPhoto.type] || currentPhoto.type}
              </span>
            )}
            <span className="text-gray-400">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
          {currentPhoto.createdAt && (
            <span className="text-gray-400 text-xs">
              {new Date(currentPhoto.createdAt).toLocaleString('th-TH')}
            </span>
          )}
        </div>

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
              title="ก่อนหน้า (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
              title="ถัดไป (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all z-10"
          title="ปิด (Esc)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
