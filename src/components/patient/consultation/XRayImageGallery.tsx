
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog';

interface XRayImageGalleryProps {
  images: string[];
}

export const XRayImageGallery: React.FC<XRayImageGalleryProps> = ({ images }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return <div className="text-gray-400 text-sm">No X-ray images available.</div>;
  }

  return (
    <div className="flex flex-row gap-4 overflow-x-auto">
      {images.map((img, idx) => (
        <Dialog key={img} open={openIndex === idx} onOpenChange={(open) => setOpenIndex(open ? idx : null)}>
          <DialogTrigger asChild>
            <img
              src={img}
              alt={`X-ray ${idx + 1}`}
              className="h-32 w-auto rounded shadow-md border cursor-pointer hover:scale-105 transition-transform duration-200"
              title="Click to enlarge"
            />
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-2 flex flex-col items-center space-y-2">
            <img
              src={img}
              alt={`X-ray ${idx + 1}`}
              className="max-h-[80vh] w-auto rounded shadow-lg border animate-scale-in"
              style={{ objectFit: 'contain' }}
            />
            <div className="text-xs text-gray-500">Click outside, press ESC, or Close to return</div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

