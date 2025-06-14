import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { xrayImageService } from "../../services/xrayImageService";
import { XRayStepsHeader } from "./XRayStepsHeader";
import XRayPatientQueue, { WaitingPatient } from "./XRayPatientQueue";
import XRayUploadPanel from "./XRayUploadPanel";

// Step-by-step progress header
const steps = [
  { key: "select", label: "Select Patient" },
  { key: "upload", label: "Upload Images" },
  { key: "note", label: "Radiologist Notes" },
  { key: "done", label: "Finish" },
];

export const XRayRoomPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

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

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          let patientName =
            data.patientName ||
            data.patientFullName ||
            null;

          // If patient name missing, fetch from the patients collection
          if (!patientName && data.patientId) {
            try {
              const patientDoc = await getDoc(doc(db, "patients", data.patientId));
              if (patientDoc.exists()) {
                const patientData = patientDoc.data();
                patientName = patientData.name || "Unknown";
              } else {
                patientName = "Unknown";
              }
            } catch (e) {
              patientName = "Unknown";
            }
          } else if (!patientName) {
            patientName = "Unknown";
          }

          patients.push({
            id: data.patientId || docSnap.id,
            name: patientName,
            consultationId: docSnap.id,
          });
        }
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

  const handleRemoveImages = () => {
    setImages([]);
    setStepIndex(1);
  };

  const handleCompleteXRay = async () => {
    if (!selectedConsultation || images.length === 0) return;
    setUploading(true);
    try {
      await xrayImageService.uploadXrayResult(
        selectedConsultation,
        images,
        note,
        userProfile?.name || "Radiologist"
      );
      toast({ title: "X-ray uploaded and marked as complete." });
      setSelectedConsultation(null);
      setSelectedPatientName("");
      setImages([]);
      setNote("");
      // Reload waiting patients, removing the completed one
      setWaitingPatients((prev) =>
        prev.filter((p) => p.consultationId !== selectedConsultation)
      );
    } catch (e) {
      toast({
        title: "Error uploading X-ray: " + (e?.message || "Unknown error"),
        variant: "destructive",
      });
    }
    setUploading(false);
  };

  // Instructions
  const instructions = (
    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md text-blue-900 shadow-sm text-sm">
      <div className="mb-2 font-semibold flex items-center gap-2">
        <Scan size={18} className="text-blue-500" /> X-ray Workflow — for Radiologist
      </div>
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
      {!selectedConsultation ? (
        <XRayPatientQueue waitingPatients={waitingPatients} onSelectPatient={handleSelectPatient} />
      ) : (
        <XRayUploadPanel
          selectedPatientName={selectedPatientName}
          selectedConsultation={selectedConsultation}
          images={images}
          note={note}
          uploading={uploading}
          onImagesChange={setImages}
          onNoteChange={setNote}
          onRemoveImages={handleRemoveImages}
          onComplete={handleCompleteXRay}
          onCancel={() => {
            setSelectedConsultation(null);
            setImages([]);
            setNote("");
            setStepIndex(0);
          }}
        />
      )}
    </div>
  );
};

// No default export; keep as named export
