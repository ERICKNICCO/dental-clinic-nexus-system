
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '../../ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCw, Grid, List } from 'lucide-react';
import { Button } from '../../ui/button';
import { XRayImageList } from './XRayImageList';

interface XRayImageGalleryProps {
  images: string[];
}

export const XRayImageGallery: React.FC<XRayImageGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!images || images.length === 0) {
    return <div className="text-gray-400 text-sm">No X-ray images available.</div>;
  }

  const handleImageClick = (img: string) => {
    console.log('Image clicked:', img);
    setSelectedImage(img);
    setZoom(100);
    setRotation(0);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setZoom(100);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <>
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">X-ray Images ({images.length})</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2"
            >
              <Grid size={14} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-2"
            >
              <List size={14} />
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="flex flex-row gap-4 overflow-x-auto">
            {images.map((img, idx) => (
              <div key={img} className="relative group cursor-pointer">
                <img
                  src={img}
                  alt={`X-ray ${idx + 1}`}
                  className="h-32 w-auto rounded shadow-md border hover:shadow-lg transition-all duration-200 hover:scale-105"
                  title={`Click to view X-ray image ${idx + 1} in full screen`}
                  onClick={() => handleImageClick(img)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center pointer-events-none">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <XRayImageList images={images} onImageClick={handleImageClick} />
        )}
      </div>

      {/* Full Screen Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black border-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Header with controls */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-90 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <ZoomOut size={16} />
                </Button>
                <span className="text-white text-sm font-medium px-3 py-1 bg-gray-800 rounded">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <ZoomIn size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="bg-white text-black hover:bg-gray-100 ml-2"
                >
                  <RotateCw size={16} />
                </Button>
              </div>
              <DialogClose className="text-white hover:text-gray-300">
                <X size={24} />
              </DialogClose>
            </div>

            {/* Full-screen image container */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="X-ray full screen"
                  className="w-full h-full object-contain transition-all duration-300 ease-in-out"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    imageRendering: 'crisp-edges',
                    filter: 'contrast(1.1) brightness(1.05)',
                  }}
                  draggable={false}
                />
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 p-4 text-center">
              <p className="text-white text-sm">
                Use the zoom controls to examine details • Rotate the image for better viewing angle • Click X or press ESC to close
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
