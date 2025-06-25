
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Edit3, Save, X, FileText, History, Stethoscope, Calendar, CreditCard } from 'lucide-react';
import PatientInfo from './PatientInfo';
import MedicalHistory from './MedicalHistory';
import TreatmentNotes from './TreatmentNotes';
import AppointmentHistory from './AppointmentHistory';
import ConsultationWorkflow from './ConsultationWorkflow';
import { useSupabasePatients } from '../../hooks/useSupabasePatients';
import { toast } from 'sonner';

const PatientFileContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, loading } = useSupabasePatients();
  const [isEditing, setIsEditing] = useState(false);

  const patient = patients.find(p => p.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600">The patient you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    toast.info('Editing mode enabled');
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Changes saved successfully');
  };

  const handleCancel = () => {
    setIsEditing(false);
    toast.info('Edit cancelled');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {patient.name}
                </CardTitle>
                <p className="text-gray-600">Patient ID: {patient.patientId}</p>
                <p className="text-sm text-gray-500">
                  {patient.gender} • {patient.dateOfBirth} • {patient.phone}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="consultation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="consultation" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            Consultation
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <FileText className="w-4 h-4" />
            Patient Info
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Medical History
          </TabsTrigger>
          <TabsTrigger value="treatment" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            Treatment Notes
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="w-4 h-4" />
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultation">
          <ConsultationWorkflow 
            patientId={patient.id} 
            patientName={patient.name}
          />
        </TabsContent>

        <TabsContent value="info">
          <PatientInfo 
            patient={{
              ...patient,
              createdAt: new Date(),
              updatedAt: new Date()
            }}
            canEdit={isEditing}
          />
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistory patientId={patient.id} isEditing={isEditing} />
        </TabsContent>

        <TabsContent value="treatment">
          <TreatmentNotes 
            patientId={patient.id} 
            patientName={patient.name}
            isEditing={isEditing} 
          />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentHistory patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientFileContent;
