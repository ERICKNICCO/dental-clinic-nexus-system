
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
        <Dialog
          key={img}
          open={openIndex === idx}
          onOpenChange={(open) => setOpenIndex(open ? idx : null)}
        >
          <DialogTrigger asChild>
            <img
              src={img}
              alt={`X-ray ${idx + 1}`}
              className="h-32 w-auto rounded shadow-md border cursor-pointer hover:scale-105 transition-transform duration-200"
              title="Click to enlarge"
            />
          </DialogTrigger>
          <DialogContent
            className="!p-0 !m-0 !max-w-none !w-screen !h-screen !border-0 !bg-black fixed inset-0 z-[9999] flex items-center justify-center"
          >
            <img
              src={img}
              alt={`X-ray ${idx + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
              }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-300 bg-black/60 px-3 py-1 rounded pointer-events-none select-none z-[10001]">
              Click outside, press ESC, or Close to return
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
