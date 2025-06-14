
import React from 'react';

interface XRayImageGalleryProps {
  images: string[];
}

export const XRayImageGallery: React.FC<XRayImageGalleryProps> = ({ images }) => {
  if (!images || images.length === 0) {
    return <div className="text-gray-400 text-sm">No X-ray images available.</div>
  }
  return (
    <div className="flex flex-row gap-4 overflow-x-auto">
      {images.map((img, idx) => (
        <img
          key={img}
          src={img}
          alt={`X-ray ${idx + 1}`}
          className="h-32 w-auto rounded shadow-md border"
        />
      ))}
    </div>
  );
};

