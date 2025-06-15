
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
            className="
              fixed inset-0 !max-w-none !rounded-none !shadow-none !p-0
              flex justify-center items-center bg-black
              "
            style={{
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.98)"
            }}
          >
            <img
              src={img}
              alt={`X-ray ${idx + 1}`}
              className="max-w-full max-h-full w-auto h-auto m-auto object-contain animate-scale-in"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                display: "block",
                background: "black"
              }}
            />
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 bg-black/60 px-3 py-1 rounded">
              Click outside, press ESC, or Close to return
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
