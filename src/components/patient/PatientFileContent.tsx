
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import PatientInfo from './PatientInfo';
import MedicalHistory from './MedicalHistory';
import TreatmentNotes from './TreatmentNotes';
import AppointmentHistory from './AppointmentHistory';
import ConsultationWorkflow from './ConsultationWorkflow';
import { ArrowLeft, Edit, Save, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePatient } from '../../hooks/usePatient';
import { useAuth } from '../../contexts/AuthContext';

interface PatientFileContentProps {
  patientId?: string;
}

const PatientFileContent: React.FC<PatientFileContentProps> = ({ patientId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { patient, loading, error } = usePatient(patientId);
  const { userProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading patient data...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error || 'Patient not found'}</p>
      </div>
    );
  }

  // Only doctors can edit patient files
  const canEditPatientFile = userProfile?.role === 'doctor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
          {canEditPatientFile && (
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit File
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditing(false)}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-gray-600">Patient ID: {patient.patientId || patient.id}</p>
        </div>
      </div>

      {/* Patient File Tabs */}
      <Tabs defaultValue="consultation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="consultation">Consultation</TabsTrigger>
          <TabsTrigger value="info">Patient Info</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="treatments">Treatment Notes</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="consultation">
          <ConsultationWorkflow patientId={patient.id} patientName={patient.name} />
        </TabsContent>

        <TabsContent value="info">
          <PatientInfo patient={patient} isEditing={isEditing && canEditPatientFile} />
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistory patientId={patient.id} isEditing={isEditing && canEditPatientFile} />
        </TabsContent>

        <TabsContent value="treatments">
          <TreatmentNotes patientId={patient.id} isEditing={isEditing && canEditPatientFile} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentHistory patientId={patient.id} isEditing={isEditing && canEditPatientFile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientFileContent;
