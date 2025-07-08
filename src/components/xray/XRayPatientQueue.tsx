
import React from "react";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";

export interface WaitingPatient {
  id: string;
  name: string;
  consultationId: string;
}

interface XRayPatientQueueProps {
  waitingPatients: WaitingPatient[];
  onSelectPatient: (consultationId: string, patientName: string) => void;
}
const XRayPatientQueue: React.FC<XRayPatientQueueProps> = ({
  waitingPatients,
  onSelectPatient,
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold mb-3">Patients waiting for X-ray</h2>
      <div className="border rounded-lg bg-blue-50">
        {waitingPatients.length === 0 && (
          <div className="p-5 text-gray-400">No patients currently waiting.</div>
        )}
        {waitingPatients.map((pat) => (
          <div
            key={pat.consultationId}
            className="flex items-center justify-between px-5 py-3 border-b last:border-0"
          >
            <div>
              <span className="font-medium">{pat.name}</span>
              <span className="text-xs text-gray-500 ml-2">({pat.consultationId})</span>
            </div>
            <Button className="flex gap-2" onClick={() => onSelectPatient(pat.consultationId, pat.name)}>
              <Upload size={16} />
              Upload X-ray
            </Button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default XRayPatientQueue;
