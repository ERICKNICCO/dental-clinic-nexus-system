
import React, { useState, useEffect } from 'react';
import { useConsultation } from '../../hooks/useConsultation';
import { useDoctorAppointments } from '../../hooks/useDoctorAppointments';
import { useMedicalHistory } from '../../hooks/useMedicalHistory';
import { useTreatmentNotes } from '../../hooks/useTreatmentNotes';
import { useAuth } from '../../contexts/AuthContext';
import { Consultation } from '../../services/consultationService';
import ConsultationHeader from './consultation/ConsultationHeader';
import ConsultationTabs from './consultation/ConsultationTabs';
import StartConsultation from './consultation/StartConsultation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface ConsultationWorkflowProps {
  patientId: string;
  patientName: string;
}

const ConsultationWorkflow: React.FC<ConsultationWorkflowProps> = ({ patientId, patientName }) => {
  const { currentUser, userProfile } = useAuth();
  const { activeConsultation, loading, startConsultation, updateConsultation, completeConsultation } = useConsultation(patientId);
  const { checkedInAppointments } = useDoctorAppointments(userProfile?.name || '');
  const { addRecord } = useMedicalHistory(patientId);
  const { addNote, refreshNotes } = useTreatmentNotes(patientId);
  const [currentStep, setCurrentStep] = useState('examination');
  const [consultationData, setConsultationData] = useState<Partial<Consultation>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Find appointment for this patient
  const patientAppointment = checkedInAppointments.find(
    appointment => appointment.patient.name === patientName
  );

  useEffect(() => {
    if (patientAppointment) {
      setSelectedAppointment(patientAppointment.id);
    }
  }, [patientAppointment]);

  // Initialize consultation data when active consultation changes
  useEffect(() => {
    if (activeConsultation) {
      console.log('Setting consultation data from active consultation:', activeConsultation);
      setConsultationData({
        symptoms: activeConsultation.symptoms || '',
        examination: activeConsultation.examination || '',
        vitalSigns: activeConsultation.vitalSigns || {},
        diagnosis: activeConsultation.diagnosis || '',
        treatmentPlan: activeConsultation.treatmentPlan || '',
        prescriptions: activeConsultation.prescriptions || '',
        followUpInstructions: activeConsultation.followUpInstructions || '',
        nextAppointment: activeConsultation.nextAppointment || '',
        estimatedCost: activeConsultation.estimatedCost || 0,
        treatmentItems: activeConsultation.treatmentItems || []
      });
    }
  }, [activeConsultation]);

  const handleStartConsultation = async () => {
    if (!currentUser || !userProfile) return;
    
    try {
      console.log('Starting consultation with:', { 
        doctorId: currentUser.uid, 
        doctorName: userProfile.name || userProfile.email,
        appointmentId: selectedAppointment
      });
      await startConsultation(
        currentUser.uid, 
        userProfile.name || userProfile.email,
        selectedAppointment || undefined
      );
      toast.success('Consultation started successfully');
    } catch (error) {
      console.error('Failed to start consultation:', error);
      toast.error('Failed to start consultation');
    }
  };

  const handleSaveProgress = async () => {
    if (!activeConsultation) {
      toast.error('No active consultation to save');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Saving consultation progress:', consultationData);
      await updateConsultation(activeConsultation.id, consultationData);
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!activeConsultation || !userProfile) {
      toast.error('No active consultation to complete');
      return;
    }
    
    setCompleting(true);
    try {
      console.log('Completing consultation with data:', consultationData);
      console.log('Patient ID:', patientId);
      console.log('User Profile:', userProfile);
      
      // Complete the consultation first
      await completeConsultation(activeConsultation.id, consultationData);
      
      // Create medical history record from consultation data
      const medicalHistoryRecord = {
        patientId: patientId,
        date: new Date().toISOString().split('T')[0], // Today's date
        condition: consultationData.diagnosis || 'General consultation',
        description: [
          consultationData.symptoms && `Symptoms: ${consultationData.symptoms}`,
          consultationData.examination && `Examination: ${consultationData.examination}`,
          consultationData.diagnosis && `Diagnosis: ${consultationData.diagnosis}`,
          consultationData.prescriptions && `Prescriptions: ${consultationData.prescriptions}`,
          consultationData.followUpInstructions && `Follow-up: ${consultationData.followUpInstructions}`
        ].filter(Boolean).join('\n\n'),
        treatment: consultationData.treatmentPlan || 'Treatment plan documented',
        doctor: userProfile.name || userProfile.email
      };
      
      console.log('Creating medical history record:', medicalHistoryRecord);
      await addRecord(medicalHistoryRecord);
      
      // Always create treatment note from consultation data
      const treatmentNote = {
        patientId: patientId,
        date: new Date().toISOString().split('T')[0],
        procedure: consultationData.diagnosis || 'General consultation',
        notes: [
          consultationData.examination && `Examination: ${consultationData.examination}`,
          consultationData.treatmentPlan && `Treatment Plan: ${consultationData.treatmentPlan}`,
          consultationData.prescriptions && `Prescriptions: ${consultationData.prescriptions}`,
          consultationData.diagnosis && `Diagnosis: ${consultationData.diagnosis}`
        ].filter(Boolean).join('\n\n') || 'Consultation completed',
        followUp: consultationData.followUpInstructions || '',
        doctor: userProfile.name || userProfile.email
      };
      
      console.log('Creating treatment note with data:', treatmentNote);
      
      try {
        await addNote(treatmentNote);
        console.log('Treatment note created successfully');
        
        // Force refresh the treatment notes list
        setTimeout(async () => {
          await refreshNotes();
          console.log('Treatment notes refreshed after completion');
        }, 1000);
        
        toast.success('Treatment note added successfully');
      } catch (treatmentNoteError) {
        console.error('Error creating treatment note:', treatmentNoteError);
        console.error('Treatment note error details:', treatmentNoteError?.message);
        toast.error('Failed to create treatment note: ' + (treatmentNoteError?.message || 'Unknown error'));
      }
      
      // Reset state
      setConsultationData({});
      setCurrentStep('examination');
      
      toast.success('Consultation completed and added to medical history');
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      console.error('Consultation completion error details:', error?.message);
      toast.error('Failed to complete consultation: ' + (error?.message || 'Unknown error'));
    } finally {
      setCompleting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    console.log('Updating field:', field, 'with value:', value);
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateVitalSigns = (field: string, value: string) => {
    console.log('Updating vital signs field:', field, 'with value:', value);
    setConsultationData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  if (!activeConsultation) {
    return (
      <div className="space-y-4">
        {patientAppointment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Time:</strong> {patientAppointment.time}</p>
                <p><strong>Treatment:</strong> {patientAppointment.treatment}</p>
                <p><strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {patientAppointment.status}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <StartConsultation
          patientName={patientName}
          loading={loading}
          onStartConsultation={handleStartConsultation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeConsultation.appointmentId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Consultation started from scheduled appointment</span>
            </div>
          </CardContent>
        </Card>
      )}

      <ConsultationHeader
        activeConsultation={activeConsultation}
        loading={saving || completing}
        onSaveProgress={handleSaveProgress}
        onCompleteConsultation={handleCompleteConsultation}
      />

      <ConsultationTabs
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        consultationData={consultationData}
        onUpdateField={updateField}
        onUpdateVitalSigns={updateVitalSigns}
        patientName={patientName}
        patientId={patientId}
      />
    </div>
  );
};

export default ConsultationWorkflow;
