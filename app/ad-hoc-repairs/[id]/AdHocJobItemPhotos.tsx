'use client';

import { useState } from 'react';
import PhotoLightbox, { PhotoItem } from '@/app/components/PhotoLightbox';
import { JobPhoto } from '@prisma/client';

interface AdHocJobItemPhotosProps {
  photos: JobPhoto[];
}

export default function AdHocJobItemPhotos({ photos }: AdHocJobItemPhotosProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const lightboxPhotos: PhotoItem[] = photos.map((p) => ({
    id: p.id,
    url: p.url,
    type: (p.type as 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER') || undefined,
    createdAt: p.createdAt,
  }));

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <>
      <div>
        <p className="text-sm text-gray-600 font-medium mb-3">รูปภาพ ({photos.length} รูป)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => handlePhotoClick(idx)}
              className="relative overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ aspectRatio: '1/1' }}
            >
              <img
                src={photo.url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {photo.type && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 text-center">
                  {photo.type === 'BEFORE' && 'ก่อน'}
                  {photo.type === 'AFTER' && 'หลัง'}
                  {photo.type === 'DEFECT' && 'ข้อบกพร่อง'}
                  {photo.type === 'METER' && 'มาตรวัด'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <PhotoLightbox
        isOpen={isLightboxOpen}
        photos={lightboxPhotos}
        currentIndex={currentPhotoIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
      />
    </>
  );
}
