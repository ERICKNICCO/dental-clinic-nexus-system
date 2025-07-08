
import React, { useRef } from "react";
import { Button } from "../ui/button";
import { XRayImageGallery } from "../patient/consultation/XRayImageGallery";
import { Upload, ArrowLeft, Scan } from "lucide-react";

interface XRayUploadPanelProps {
  selectedPatientName: string;
  selectedConsultation: string;
  images: File[];
  uploading: boolean;
  onImagesChange: (files: File[]) => void;
  onRemoveImages: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const XRayUploadPanel: React.FC<XRayUploadPanelProps> = ({
  selectedPatientName,
  selectedConsultation,
  images,
  uploading,
  onImagesChange,
  onRemoveImages,
  onComplete,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onImagesChange(Array.from(e.target.files));
    }
  };

  // Dropzone logic for drag & drop upload
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      onImagesChange(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded shadow p-6 mb-6">
      <div className="mb-5 text-blue-900">
        <div className="font-semibold text-base mb-1">
          For: <span className="text-blue-700">{selectedPatientName}</span>
        </div>
        <div className="text-xs text-gray-500">Consultation ID: {selectedConsultation}</div>
      </div>
      <div
        className={`border-2 border-dashed ${
          images.length > 0 ? "border-blue-400 bg-blue-100" : "border-gray-300 bg-white"
        } rounded-lg p-6 mb-4 min-h-[130px] transition flex flex-col items-center justify-center cursor-pointer hover:border-blue-500`}
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        aria-label="Upload your exported X-ray images here"
      >
        {images.length === 0 ? (
          <>
            <Upload size={36} className="mb-2 text-blue-400" />
            <span className="text-gray-500">Drag & drop X-ray images here, or click to select files.</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadImages}
              className="hidden"
            />
          </>
        ) : (
          <>
            <XRayImageGallery images={images.map((file) => URL.createObjectURL(file))} />
            <Button variant="outline" className="mt-2" onClick={onRemoveImages} type="button">
              Remove Images
            </Button>
          </>
        )}
      </div>

      <div className="flex space-x-2 mt-5">
        <Button
          disabled={uploading || images.length === 0}
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload size={16} className="inline mr-1 -mt-1" /> Complete X-ray
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      </div>
      {images.length === 0 && (
        <div className="text-xs text-blue-500 mt-3">
          Please upload exported X-ray images (JPG, PNG, etc.) from EZ-dent or similar imaging software.
        </div>
      )}
    </div>
  );
};

export default XRayUploadPanel;
