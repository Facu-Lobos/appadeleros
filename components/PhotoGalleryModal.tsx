import React, { useState, useEffect, useCallback } from 'react';

interface PhotoGalleryModalProps {
  photos: string[];
  onClose: () => void;
  initialIndex?: number;
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ photos, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? photos.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = useCallback(() => {
    const isLastSlide = currentIndex === photos.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, photos]);

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col justify-center items-center z-50 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
        aria-label="Cerrar galería"
      >
        &times;
      </button>

      <div className="relative w-full h-3/4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          className="absolute top-1/2 left-0 md:left-10 -translate-y-1/2 bg-white/10 text-white rounded-full p-3 hover:bg-white/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Main Image */}
        <div className="w-full h-full max-w-5xl flex items-center justify-center">
            <img 
                src={photos[currentIndex]} 
                alt={`Foto de la galería ${currentIndex + 1}`} 
                className="max-h-full max-w-full object-contain"
            />
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className="absolute top-1/2 right-0 md:right-10 -translate-y-1/2 bg-white/10 text-white rounded-full p-3 hover:bg-white/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Thumbnails */}
      <div className="w-full h-1/4 max-w-5xl mt-4 flex justify-center items-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex space-x-2 p-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`w-24 h-16 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-300 ${currentIndex === index ? 'border-2 border-primary' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => goToSlide(index)}
            >
              <img src={photo} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;