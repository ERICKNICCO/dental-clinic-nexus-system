
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { User, FileText, Activity, Calendar, AlertCircle } from 'lucide-react';
import PatientInfo from './PatientInfo';
import MedicalHistory from './MedicalHistory';
import TreatmentNotes from './TreatmentNotes';
import AppointmentHistory from './AppointmentHistory';
import ConsultationWorkflow from './ConsultationWorkflow';
import { usePatient } from '../../hooks/usePatient';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';

interface PatientFileContentProps {
  patientId?: string;
}

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  patientType: 'insurance' | 'cash';
  lastVisit: string;
  nextAppointment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PatientFileContent: React.FC<PatientFileContentProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState('info');
  const { patient, loading, error } = usePatient(patientId);
  const { userProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
          <p className="text-gray-600">{error || 'Unable to load patient information'}</p>
        </div>
      </div>
    );
  }

  const isDoctor = userProfile?.role === 'doctor';
  const canEdit = isDoctor; // Only doctors can edit patient files

  // Ensure patient has all required properties with defaults
  const patientWithDefaults: Patient = {
    id: patient.id,
    patientId: patient.patientId,
    name: patient.name,
    email: patient.email || '',
    phone: patient.phone || '',
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    emergencyPhone: patient.emergencyPhone,
    insurance: patient.insurance || '',
    patientType: (patient as any).patientType || 'cash',
    lastVisit: patient.lastVisit,
    nextAppointment: patient.nextAppointment,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient File - {patient.name}
            {patient.patientId && (
              <span className="text-sm font-normal text-gray-500">
                (ID: {patient.patientId})
              </span>
            )}
          </CardTitle>
          {!canEdit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have view-only access to this patient file. Only doctors can make edits.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Consultation</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Treatments</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <PatientInfo patient={patientWithDefaults} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="consultation">
          {canEdit ? (
            <ConsultationWorkflow
              patientId={patient.id}
              patientName={patient.name}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Consultation workflow is only available to doctors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistory patientId={patient.id} isEditing={canEdit} />
        </TabsContent>

        <TabsContent value="treatments">
          <TreatmentNotes patientId={patient.id} isEditing={canEdit} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentHistory patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientFileContent;
