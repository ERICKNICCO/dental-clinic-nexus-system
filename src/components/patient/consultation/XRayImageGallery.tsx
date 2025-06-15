
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Download } from 'lucide-react';
import { Button } from '../../ui/button';

interface XRayImageGalleryProps {
  images: string[];
}

export const XRayImageGallery: React.FC<XRayImageGalleryProps> = ({ images }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!images || images.length === 0) {
    return <div className="text-gray-400 text-sm">No X-ray images available.</div>;
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev * delta)));
  };

  const handleDialogChange = (open: boolean, index: number) => {
    if (open) {
      setOpenIndex(index);
      // Reset viewing parameters when opening
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    } else {
      setOpenIndex(null);
    }
  };

  return (
    <div className="flex flex-row gap-4 overflow-x-auto">
      {images.map((img, idx) => (
        <Dialog
          key={img}
          open={openIndex === idx}
          onOpenChange={(open) => handleDialogChange(open, idx)}
        >
          <DialogTrigger asChild>
            <div className="relative group cursor-pointer">
              <img
                src={img}
                alt={`X-ray ${idx + 1}`}
                className="h-32 w-auto rounded shadow-md border hover:shadow-lg transition-all duration-200"
                title="Click to open medical viewer"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="!p-0 !m-0 !max-w-none !w-screen !h-screen !border-0 bg-black fixed inset-0 z-[9999]">
            {/* Medical Viewer Controls */}
            <div className="absolute top-4 left-4 z-[10001] flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleZoomIn}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleZoomOut}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRotate}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleReset}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Level Indicator */}
            <div className="absolute top-4 right-4 z-[10001] bg-gray-800 text-white px-3 py-1 rounded text-sm">
              {Math.round(zoom * 100)}%
            </div>

            {/* Main Image Viewer */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <img
                src={img}
                alt={`X-ray ${idx + 1}`}
                className="select-none transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: 'auto',
                  height: 'auto',
                  imageRendering: 'high-quality',
                }}
                draggable={false}
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-300 bg-black/60 px-4 py-2 rounded pointer-events-none select-none z-[10001] text-center">
              <div>Use mouse wheel to zoom • Drag to pan when zoomed • Use controls to rotate</div>
              <div className="mt-1">Press ESC or click X to close</div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
