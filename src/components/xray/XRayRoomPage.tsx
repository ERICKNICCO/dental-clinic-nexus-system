
import React, { useEffect, useState } from "react";
import { XRayImageGallery } from "../patient/consultation/XRayImageGallery";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { xrayImageService } from "../../services/xrayImageService";

interface WaitingPatient {
  id: string;
  name: string;
  consultationId: string;
}

export const XRayRoomPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load patients waiting for X-ray
  useEffect(() => {
    // You'd load all consultations where consultation.status === 'waiting-xray'
    // Mock for now; replace with real hook/service if available
    const load = async () => {
      // TODO: Replace with API call
      setWaitingPatients([
        // Example
        // { id: 'pat1', name: 'Alice Smith', consultationId: 'con1' }
      ]);
    };
    load();
  }, []);

  const handleSelectPatient = (consultationId: string) => {
    setSelectedConsultation(consultationId);
    setImages([]);
    setNote("");
  };

  const handleUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleCompleteXRay = async () => {
    if (!selectedConsultation || images.length === 0) return;
    setUploading(true);
    try {
      // Upload images and notes to the backend
      await xrayImageService.uploadXrayResult(selectedConsultation, images, note, userProfile?.name || "Radiologist");
      alert("X-ray uploaded and marked as complete.");
      setSelectedConsultation(null);
      setImages([]);
      setNote("");
      // TODO: Reload waiting patients after completion.
    } catch (e) {
      alert("Error uploading X-ray: " + (e?.message || "Unknown error"));
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">X-ray Room</h1>
      {!selectedConsultation ? (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-2">Patients waiting for X-ray</h2>
            <ul>
              {waitingPatients.length === 0 && <li className="text-gray-400">No patients currently waiting.</li>}
              {waitingPatients.map(pat => (
                <li key={pat.consultationId} className="mb-3 flex justify-between">
                  <span>
                    <strong>{pat.name}</strong>
                    <span className="text-xs text-gray-500 ml-2">({pat.consultationId})</span>
                  </span>
                  <Button onClick={() => handleSelectPatient(pat.consultationId)}>Select</Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-white border rounded shadow p-6">
          <h2 className="font-semibold mb-4">Upload X-ray for Consultation {selectedConsultation}</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUploadImages}
            className="mb-2"
          />
          {images.length > 0 && (
            <div className="mb-2">
              <XRayImageGallery images={images.map(file => URL.createObjectURL(file))} />
            </div>
          )}
          <div className="mb-2">
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Radiologist notes..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button disabled={uploading || images.length === 0} onClick={handleCompleteXRay}>
              {uploading ? "Uploading..." : "Complete X-ray"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedConsultation(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

