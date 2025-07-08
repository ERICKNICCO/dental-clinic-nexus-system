
import React from 'react';
import { Button } from '../../ui/button';
import { Eye, Download, Calendar, FileImage, HardDrive } from 'lucide-react';

interface XRayImageData {
  url: string;
  name: string;
  date: string;
  size: string;
  type: string;
}

interface XRayImageListProps {
  images: string[];
  onImageClick: (img: string) => void;
}

export const XRayImageList: React.FC<XRayImageListProps> = ({ images, onImageClick }) => {
  // Convert image URLs to structured data with mock metadata
  const imageData: XRayImageData[] = images.map((url, index) => {
    const fileName = `xray-${index + 1}.png`;
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const sizes = ['156 KB', '287 KB', '203 KB', '445 KB', '178 KB'];
    const size = sizes[index % sizes.length];
    
    return {
      url,
      name: fileName,
      date,
      size,
      type: 'PNG File'
    };
  });

  if (!images || images.length === 0) {
    return <div className="text-gray-400 text-sm">No X-ray images available.</div>;
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
        <div className="col-span-5 flex items-center gap-2">
          <FileImage size={16} />
          Name
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Calendar size={16} />
          Date
        </div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2 flex items-center gap-2">
          <HardDrive size={16} />
          Size
        </div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Image List */}
      <div className="divide-y divide-gray-100">
        {imageData.map((image, index) => (
          <div
            key={image.url}
            className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
          >
            {/* Name with thumbnail */}
            <div className="col-span-5 flex items-center gap-3">
              <div className="flex-shrink-0">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-8 h-8 rounded object-cover border"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {image.name}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="col-span-2">
              <p className="text-sm text-gray-600">{image.date}</p>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <p className="text-sm text-gray-600">{image.type}</p>
            </div>

            {/* Size */}
            <div className="col-span-2">
              <p className="text-sm text-gray-600">{image.size}</p>
            </div>

            {/* Actions */}
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageClick(image.url)}
                className="h-8 w-8 p-0"
                title="View full screen"
              >
                <Eye size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="bg-gray-50 border-t px-4 py-2">
        <p className="text-xs text-gray-500">
          {images.length} image{images.length !== 1 ? 's' : ''} • Total size: {
            imageData.reduce((total, img) => {
              const sizeNum = parseInt(img.size);
              return total + (isNaN(sizeNum) ? 0 : sizeNum);
            }, 0)
          } KB (estimated)
        </p>
      </div>
    </div>
  );
};
