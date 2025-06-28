import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabaseConsultationService } from "../../services/supabaseConsultationService";
import { xrayImageService } from "../../services/xrayImageService";
import { useSupabasePatients } from "../../hooks/useSupabasePatients";
import { XRayStepsHeader } from "./XRayStepsHeader";
import XRayPatientQueue, { WaitingPatient } from "./XRayPatientQueue";
import XRayUploadPanel from "./XRayUploadPanel";

// Step-by-step progress header
const steps = [
  { key: "select", label: "Select Patient" },
  { key: "upload", label: "Upload Images" },
  { key: "done", label: "Finish" },
];

export const XRayRoomPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { patients } = useSupabasePatients();
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const navigate = useNavigate();

  // Load patients waiting for X-ray from Supabase
  useEffect(() => {
    const fetchWaitingPatients = async () => {
      try {
        console.log('🔥 XRayRoomPage: Fetching waiting consultations');
        const consultations = await supabaseConsultationService.getWaitingXRayConsultations();
        console.log('🔥 XRayRoomPage: Found consultations:', consultations);

        // Use a map to keep only one consultation per patientId
        const uniquePatientsMap = new Map<string, WaitingPatient>();

        for (const consultation of consultations) {
          const patientIdFromConsultation = consultation.patientId;
          const consultationId = consultation.id;

          console.log('🔥 XRayRoomPage: Processing consultation:', {
            consultationId,
            patientId: patientIdFromConsultation
          });

          if (!patientIdFromConsultation) {
            console.warn(`Consultation ${consultationId} is missing patient_id.`);
            continue;
          }

          if (!uniquePatientsMap.has(patientIdFromConsultation)) {
            // Find patient details from Supabase patients data
            const patient = patients.find(p => p.id === patientIdFromConsultation);
            const patientName = patient?.name || "Unknown Patient";

            console.log(`🔥 XRayRoomPage: Found patient for ID ${patientIdFromConsultation}:`, {
              patient: patient ? { id: patient.id, name: patient.name } : null,
              patientName
            });

            uniquePatientsMap.set(patientIdFromConsultation, {
              id: patientIdFromConsultation,
              name: patientName,
              consultationId: consultationId,
            });
          }
        }
        
        const waitingPatientsArray = Array.from(uniquePatientsMap.values());
        console.log('🔥 XRayRoomPage: Final waiting patients:', waitingPatientsArray);
        setWaitingPatients(waitingPatientsArray);
      } catch (e) {
        console.error("Error loading X-ray queue:", e);
        toast({ title: "Failed to load X-ray queue", description: "Please try again later.", variant: "destructive" });
        setWaitingPatients([]);
      }
    };
    
    if (patients.length > 0) {
      console.log('🔥 XRayRoomPage: Patients loaded, fetching waiting patients');
      fetchWaitingPatients();
    } else {
      console.log('🔥 XRayRoomPage: No patients loaded yet');
    }
  }, [patients]);

  useEffect(() => {
    // Update step index based on UI
    if (!selectedConsultation) setStepIndex(0);
    else if (images.length === 0) setStepIndex(1);
    else setStepIndex(2);
  }, [selectedConsultation, images]);

  const handleSelectPatient = (consultationId: string, patientName: string) => {
    console.log('🔥 XRayRoomPage: Selecting patient:', { consultationId, patientName });
    setSelectedConsultation(consultationId);
    setSelectedPatientName(patientName);
    setImages([]);
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
        "", // Empty note
        userProfile?.name || "Radiologist"
      );
      toast({ title: "X-ray uploaded and marked as complete." });
      setSelectedConsultation(null);
      setSelectedPatientName("");
      setImages([]);
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
        <li>Upload those images below.</li>
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
          uploading={uploading}
          onImagesChange={setImages}
          onRemoveImages={handleRemoveImages}
          onComplete={handleCompleteXRay}
          onCancel={() => {
            setSelectedConsultation(null);
            setImages([]);
            setStepIndex(0);
          }}
        />
      )}
    </div>
  );
};

// No default export; keep as named export
