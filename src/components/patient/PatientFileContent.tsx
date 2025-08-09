import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { useAuth } from '../../contexts/AuthContext';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';

const PatientFileContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { patients, loading, error, refreshPatients } = useSupabasePatients();
  const [isEditing, setIsEditing] = useState(false);
  const { userProfile } = useAuth();
  const [canAccess, setCanAccess] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Extract patient ID from URL path if useParams doesn't work
  const getPatientIdFromPath = () => {
    if (id) return id;
    
    // Fallback: extract from pathname
    const pathParts = location.pathname.split('/');
    const patientsIndex = pathParts.indexOf('patients');
    if (patientsIndex !== -1 && pathParts[patientsIndex + 1]) {
      return pathParts[patientsIndex + 1];
    }
    return null;
  };

  const patientId = getPatientIdFromPath();

  console.log('🔥 PatientFileContent - Patient ID from URL:', patientId);
  console.log('🔥 PatientFileContent - useParams id:', id);
  console.log('🔥 PatientFileContent - Location pathname:', location.pathname);
  console.log('🔥 PatientFileContent - All patients:', patients);
  console.log('🔥 PatientFileContent - Loading:', loading);
  console.log('🔥 PatientFileContent - Error:', error);

  // Find patient by ID with proper string comparison
  const patient = patients.find(p => {
    console.log('🔍 Comparing patient ID:', p.id, 'with URL id:', patientId, 'Match:', p.id === patientId);
    return p.id === patientId;
  });

  console.log('🔥 PatientFileContent - Found patient:', patient);

  // Force refresh patients if we have an ID but no patient found and not loading
  useEffect(() => {
    if (patientId && !patient && !loading) {
      console.log('🔥 PatientFileContent - Patient not found, refreshing patients');
      refreshPatients();
    }
  }, [patientId, patient, loading, refreshPatients]);

  useEffect(() => {
    // Doctors and admins have full access to patient files
    setCanAccess(true);
    setCheckingAccess(false);
  }, [userProfile, patientId]);

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You cannot access this patient file until the appointment is approved by an admin.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Patient</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Patient URL</h2>
          <p className="text-gray-600 mb-4">
            No patient ID found in the URL.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>URL: {location.pathname}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/patients'}
            >
              View All Patients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient && !loading) {
    console.log('❌ Patient not found. URL ID:', patientId);
    console.log('❌ Available patients:', patients.map(p => ({ id: p.id, name: p.name })));
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">
            The patient you're looking for doesn't exist or may have been removed.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Patient ID: {patientId}</p>
            <p>Available patients: {patients.length}</p>
            {patients.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Debug: Show available patient IDs</summary>
                <ul className="mt-2 text-left">
                  {patients.map(p => (
                    <li key={p.id} className="text-xs">
                      {p.name} (ID: {p.id})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className="space-x-2">
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/patients'}
            >
              View All Patients
            </Button>
            <Button 
              onClick={() => refreshPatients()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Patient Data
            </Button>
          </div>
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
    refreshPatients();
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
                  {patient?.name}
                </CardTitle>
                <p className="text-gray-600">Patient ID: {patient?.patientId}</p>
                <p className="text-sm text-gray-500">
                  {patient?.gender} • {patient?.dateOfBirth} • {patient?.phone}
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
            patientId={patient?.id || ''} 
            patientName={patient?.name || ''}
          />
        </TabsContent>

        <TabsContent value="info">
          <PatientInfo 
            patient={{
              ...patient!,
              createdAt: new Date(),
              updatedAt: new Date()
            }}
            canEdit={isEditing}
          />
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistory patientId={patient?.id || ''} isEditing={isEditing} />
        </TabsContent>

        <TabsContent value="treatment">
          <TreatmentNotes 
            patientId={patient?.id || ''} 
            patientName={patient?.name || ''}
            isEditing={isEditing} 
          />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentHistory patientId={patient?.id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientFileContent;
