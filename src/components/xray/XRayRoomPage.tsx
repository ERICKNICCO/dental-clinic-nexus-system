import React, { useEffect, useState, useRef } from "react";
import { XRayImageGallery } from "../patient/consultation/XRayImageGallery";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { xrayImageService } from "../../services/xrayImageService";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Scan, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Step-by-step progress header
const steps = [
  { key: "select", label: "Select Patient" },
  { key: "upload", label: "Upload Images" },
  { key: "note", label: "Radiologist Notes" },
  { key: "done", label: "Finish" },
];

function XRayStepsHeader({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full border-2 w-8 h-8 flex items-center justify-center mb-1 transition
                ${
                  idx === stepIndex
                    ? "bg-blue-600 border-blue-600 text-white"
                    : idx < stepIndex
                    ? "bg-blue-100 border-blue-300 text-blue-500"
                    : "bg-gray-200 border-gray-300 text-gray-400"
                }
              `}
            >
              {idx === 0 && <Scan size={20} />}
              {idx === 1 && <Upload size={20} />}
              {idx === 2 && <span className="font-bold text-base">N</span>}
              {idx === 3 && <span className="font-bold text-base">✓</span>}
            </div>
            <span className={`text-xs ${idx === stepIndex ? "text-blue-700 font-semibold" : "text-gray-500"}`}>{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                idx < stepIndex ? "bg-blue-300" : "bg-gray-200"
              } mx-2 rounded transition`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface WaitingPatient {
  id: string;
  name: string;
  consultationId: string;
}

export const XRayRoomPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load patients waiting for X-ray from Firebase (not using mock data)
  useEffect(() => {
    const fetchWaitingPatients = async () => {
      try {
        const q = query(
          collection(db, "consultations"),
          where("status", "==", "waiting-xray")
        );
        const querySnapshot = await getDocs(q);
        const patients: WaitingPatient[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Use fallback if name doesn't exist (could be extended as needed)
          patients.push({
            id: data.patientId || doc.id,
            name: data.patientName || data.patientFullName || "Unknown",
            consultationId: doc.id,
          });
        });
        setWaitingPatients(patients);
      } catch (e) {
        toast({ title: "Failed to load X-ray queue", variant: "destructive" });
        setWaitingPatients([]);
      }
    };
    fetchWaitingPatients();
  }, []);

  useEffect(() => {
    // Update step index based on UI
    if (!selectedConsultation) setStepIndex(0);
    else if (images.length === 0) setStepIndex(1);
    else if (note.length < 5) setStepIndex(2);
    else setStepIndex(3);
  }, [selectedConsultation, images, note]);

  const handleSelectPatient = (consultationId: string, patientName: string) => {
    setSelectedConsultation(consultationId);
    setSelectedPatientName(patientName);
    setImages([]);
    setNote("");
    setStepIndex(1);
  };

  const handleUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  // Dropzone logic for drag & drop upload
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      setImages(files);
      toast({ title: "Images added." });
    } else {
      toast({ title: "Please drop image files only.", variant: "destructive" });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCompleteXRay = async () => {
    if (!selectedConsultation || images.length === 0) return;
    setUploading(true);
    try {
      await xrayImageService.uploadXrayResult(selectedConsultation, images, note, userProfile?.name || "Radiologist");
      toast({ title: "X-ray uploaded and marked as complete." });
      setSelectedConsultation(null);
      setSelectedPatientName("");
      setImages([]);
      setNote("");
      // Reload waiting patients, removing the completed one
      setWaitingPatients((prev) => prev.filter(p => p.consultationId !== selectedConsultation));
    } catch (e) {
      toast({ title: "Error uploading X-ray: " + (e?.message || "Unknown error"), variant: "destructive" });
    }
    setUploading(false);
  };

  // Instructions
  const instructions = (
    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md text-blue-900 shadow-sm text-sm">
      <div className="mb-2 font-semibold flex items-center gap-2"><Scan size={18} className="text-blue-500" /> X-ray Workflow — for Radiologist</div>
      <ol className="list-decimal list-inside space-y-1 pl-1">
        <li>Select the next patient waiting for X-ray review.</li>
        <li>Export X-ray images from EZ-dent (or your imaging software).</li>
        <li>Upload those images below and add your findings or notes.</li>
        <li>Click "Complete X-ray" to finish and move to the next patient.</li>
      </ol>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-8">
      {/* Always show Back to Dashboard */}
      <button
        className="flex items-center gap-2 text-blue-600 hover:underline mb-4 transition text-sm font-medium"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      {/* Conditional: Back to queue for selected consultation */}
      {selectedConsultation && (
        <button
          className="flex items-center gap-2 text-blue-500 hover:underline mb-2 transition text-xs font-medium"
          onClick={() => {
            setSelectedConsultation(null);
            setSelectedPatientName("");
            setImages([]);
            setNote("");
            setStepIndex(0);
          }}
          type="button"
        >
          <ArrowLeft size={16} />
          Back to queue
        </button>
      )}
      <h1 className="text-2xl font-bold text-blue-700 mb-2 flex items-center gap-2">
        <Scan size={28} className="text-blue-600" />
        X-ray Room
      </h1>
      {instructions}
      <XRayStepsHeader stepIndex={stepIndex} />

      {/* Step 1: Patient queue */}
      {!selectedConsultation ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">Patients waiting for X-ray</h2>
            <div className="border rounded-lg bg-blue-50">
              {waitingPatients.length === 0 && <div className="p-5 text-gray-400">No patients currently waiting.</div>}
              {waitingPatients.map(pat => (
                <div
                  key={pat.consultationId}
                  className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{pat.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({pat.consultationId})</span>
                  </div>
                  <Button
                    className="flex gap-2"
                    onClick={() => handleSelectPatient(pat.consultationId, pat.name)}
                  >
                    <Upload size={16} />
                    Upload X-ray
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Step 2-4: Upload flow for selected consultation
        <div className="bg-blue-50 border border-blue-100 rounded shadow p-6 mb-6">
          <div className="mb-5 text-blue-900">
            <div className="font-semibold text-base mb-1">For: <span className="text-blue-700">{selectedPatientName}</span></div>
            <div className="text-xs text-gray-500">Consultation ID: {selectedConsultation}</div>
          </div>
          {/* Dropzone and image preview */}
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
                <XRayImageGallery images={images.map(file => URL.createObjectURL(file))} />
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setImages([]);
                    setStepIndex(1);
                  }}
                  type="button"
                >
                  Remove Images
                </Button>
              </>
            )}
          </div>

          {/* Step 3: Notes textarea */}
          <div>
            <label htmlFor="radiologist-note" className="block font-semibold mb-1">Radiologist Notes</label>
            <textarea
              id="radiologist-note"
              className="w-full border rounded p-2 min-h-[80px] focus:ring focus:ring-blue-100"
              rows={3}
              placeholder="Enter radiologist findings or comments here…"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={uploading}
              maxLength={1000}
            />
            <div className="text-xs text-gray-400 mt-1">e.g. caries, fracture, impacted tooth, etc</div>
          </div>
          {/* Step 4: Actions */}
          <div className="flex space-x-2 mt-5">
            <Button
              disabled={uploading || images.length === 0 || note.length < 5}
              onClick={handleCompleteXRay}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {uploading ? "Uploading..." : <><Upload size={16} className="inline mr-1 -mt-1" /> Complete X-ray</>}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSelectedConsultation(null); setImages([]); setNote(""); setStepIndex(0); }}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
          {images.length === 0 && (
            <div className="text-xs text-blue-500 mt-3">
              Please upload exported X-ray images (JPG, PNG, etc.) from EZ-dent or similar imaging software.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
