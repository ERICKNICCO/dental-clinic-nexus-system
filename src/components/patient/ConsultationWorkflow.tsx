import React, { useState, useEffect } from 'react';
import { useSupabaseConsultation } from '../../hooks/useSupabaseConsultation';
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
import { Clock, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '../../services/paymentService';
import { adminNotificationService } from '../../services/adminNotificationService';
import { useSupabasePatients } from '../../hooks/useSupabasePatients';
import { supabaseConsultationService } from '../../services/supabaseConsultationService';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';
import { useAppointments } from '../../hooks/useAppointments';

interface ConsultationWorkflowProps {
  patientId: string;
  patientName: string;
}

const ConsultationWorkflow: React.FC<ConsultationWorkflowProps> = ({ patientId, patientName }) => {
  const { currentUser, userProfile } = useAuth();
  const { activeConsultation, loading, startConsultation, updateConsultation, completeConsultation, refreshConsultation } = useSupabaseConsultation(patientId);
  const { checkedInAppointments } = useDoctorAppointments(userProfile?.name || '');
  const { addRecord } = useMedicalHistory(patientId);
  const { addNote, refreshNotes } = useTreatmentNotes(patientId);
  const [currentStep, setCurrentStep] = useState('examination');
  const [consultationData, setConsultationData] = useState<Partial<Consultation>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { patients } = useSupabasePatients();
  const patient = patients.find(p => p.id === patientId);
  const { refreshAppointments } = useAppointments();

  // Check if user is admin to restrict editing
  const isAdmin = userProfile?.role === 'admin';
  const isDoctor = userProfile?.role === 'doctor';

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
        vital_signs: activeConsultation?.vital_signs || {},
        diagnosis: activeConsultation?.diagnosis || '',
        diagnosis_type: activeConsultation?.diagnosis_type || 'clinical',
        treatment_plan: activeConsultation?.treatment_plan || '',
        prescriptions: activeConsultation?.prescriptions || '',
        follow_up_instructions: activeConsultation?.follow_up_instructions || '',
        next_appointment: activeConsultation?.next_appointment || '',
        estimated_cost: activeConsultation?.estimated_cost || 0,
        treatment_items: activeConsultation?.treatment_items || []
      });
    }
  }, [activeConsultation]);

  // Auto-refresh consultation when status is waiting-xray to check for updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeConsultation?.status === 'waiting-xray') {
      console.log('Setting up auto-refresh for X-ray status');
      interval = setInterval(async () => {
        console.log('Auto-refreshing consultation for X-ray updates');
        if (refreshConsultation) {
          await refreshConsultation();
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeConsultation?.status, refreshConsultation]);

  const handleRefreshConsultation = async () => {
    if (!refreshConsultation) return;
    
    setRefreshing(true);
    try {
      await refreshConsultation();
      toast.success('Consultation data refreshed');
    } catch (error) {
      console.error('Failed to refresh consultation:', error);
      toast.error('Failed to refresh consultation data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartConsultation = async () => {
    if (!currentUser || !userProfile) return;
    
    try {
      console.log('Starting consultation with:', { 
        doctorId: currentUser.id, 
        doctorName: userProfile.name || userProfile.email,
        appointmentId: selectedAppointment
      });
      await startConsultation(
        currentUser.id, 
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
      
      // Update appointment status to Completed if appointment exists
      const apptId = selectedAppointment || activeConsultation.appointment_id || undefined;
      if (apptId) {
        try {
          await supabaseAppointmentService.updateAppointment(apptId, { status: 'Completed' });
          console.log('Appointment status updated to Completed');
          if (refreshAppointments) {
            await refreshAppointments();
            console.log('Appointments list refreshed after completion');
          }
        } catch (err) {
          console.error('Failed to update appointment status:', err);
        }
      }
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
          consultationData.follow_up_instructions && `Follow-up: ${consultationData.follow_up_instructions}`
        ].filter(Boolean).join('\n\n'),
        treatment: consultationData.treatment_plan || 'Treatment plan documented',
        doctor: userProfile.name || userProfile.email
      };
      
      console.log('Creating medical history record:', medicalHistoryRecord);
      await addRecord(medicalHistoryRecord);
      
      // Create treatment note from consultation data
      const treatmentNote = {
        patientId: patientId,
        patientName: patientName, // Add patient name for the treatment record
        date: new Date().toISOString().split('T')[0],
        procedure: consultationData.diagnosis || 'General consultation',
        notes: [
          consultationData.examination && `Examination: ${consultationData.examination}`,
          consultationData.treatment_plan && `Treatment Plan: ${consultationData.treatment_plan}`,
          consultationData.prescriptions && `Prescriptions: ${consultationData.prescriptions}`,
          consultationData.diagnosis && `Diagnosis: ${consultationData.diagnosis}`
        ].filter(Boolean).join('\n\n') || 'Consultation completed',
        followUp: consultationData.follow_up_instructions || '',
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

      // After consultation is fully completed, create payment record with finalized treatments
      try {
        // Prevent duplicate payment records for the same consultation
        const existingPayments = await paymentService.getAllPayments();
        const alreadyExists = existingPayments.some(p => p.consultation_id === activeConsultation.id);
        if (alreadyExists) {
          console.log('Payment record already exists for this consultation, skipping creation.');
        } else {
          // Fetch the latest consultation data to ensure all treatments are included
          const latestConsultation = await supabaseConsultationService.getConsultation(activeConsultation.id);
          let items: any[] = [];
          if (latestConsultation && Array.isArray(latestConsultation.treatment_items)) {
            items = latestConsultation.treatment_items;
          } else if (latestConsultation && typeof latestConsultation.treatment_items === 'string') {
            try {
              items = JSON.parse(latestConsultation.treatment_items);
            } catch (e) {
              items = [];
            }
          }
          // Always include consultation fee if not present
          const hasConsultation = items.some(item => item.name && item.name.toLowerCase().includes('consultation'));
          if (!hasConsultation) {
            items = [
              { name: 'CONSULTATION', cost: 30000, duration: 10 },
              ...items
            ];
          }
          let treatmentName = '';
          if (items.length > 0) {
            treatmentName = items.map(item =>
              `${item.name} - TSh ${item.cost.toLocaleString()}${item.duration ? ` (${item.duration} min)` : ''}`
            ).join(' • ');
          } else {
            treatmentName = latestConsultation?.diagnosis || 'General consultation';
          }
          // Sum all treatment costs for total
          const estimatedCost = items.reduce((sum, item) => sum + (item.cost || 0), 0) || 30000;
          const paymentData = {
            patient_id: patientId,
            patient_name: patientName,
            treatment_name: treatmentName,
            total_amount: typeof estimatedCost === 'string' 
              ? Math.round(parseFloat(estimatedCost)) 
              : estimatedCost,
            amount_paid: 0,
            payment_status: 'pending' as const,
            payment_method: patient?.patientType || 'cash',
            insurance_provider: patient?.insurance || 'N/A',
            collected_by: userProfile.name || userProfile.email,
            notes: `Treatment: ${latestConsultation?.treatment_plan}`,
            appointment_id: selectedAppointment,
            consultation_id: activeConsultation.id
          };
          await paymentService.createPayment(paymentData);
          console.log('Payment record created automatically');
          toast.success('Payment record created for admin collection');
        }
      } catch (paymentError) {
        console.error('Error creating payment record:', paymentError);
        toast.error('Failed to create payment record');
      }

      // Notify admin for completed consultation
      try {
        await adminNotificationService.notifyAdminForConsultationCompleted({
          patientId: patientId,
          patientName: patientName,
          doctorName: userProfile.name || userProfile.email,
          consultationId: activeConsultation.id,
          diagnosis: consultationData.diagnosis,
          estimatedCost: consultationData.estimated_cost,
          appointmentId: selectedAppointment || undefined
        });
        
        console.log('Admin notified for completed consultation');
        toast.success('Admin has been notified about completed consultation');
      } catch (notificationError) {
        console.error('Error notifying admin:', notificationError);
        // Don't fail the whole process if notification fails
      }

      // Notify admin for payment collection if needed
      if (consultationData.diagnosis && consultationData.treatment_plan) {
        try {
          await adminNotificationService.notifyAdminForPaymentCollection({
            patientId: patientId,
            patientName: patientName,
            diagnosis: consultationData.diagnosis,
            estimatedCost: consultationData.estimated_cost || 50000,
            consultationId: activeConsultation.id,
            appointmentId: selectedAppointment || undefined
          });
          
          console.log('Admin notified for payment collection');
        } catch (notificationError) {
          console.error('Error notifying admin:', notificationError);
        }
      }
      
      // Reset state
      setConsultationData({});
      setCurrentStep('examination');
      
      toast.success('Consultation completed and admin notified for payment collection');
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

  const handleSendToXRay = async () => {
    if (!activeConsultation) return;
    try {
      await updateConsultation(activeConsultation.id, { status: "waiting-xray" });

      // Removed: const consultRef = doc(db, "consultations", activeConsultation.id);
      // Removed: await updateDoc(consultRef, {
      // Removed:   status: "waiting-xray",
      // Removed:   updatedAt: new Date().toISOString(),
      // Removed: });

      toast.success("Patient sent to X-ray room!");
    } catch (error) {
      console.error("Failed to send to X-ray room:", error);
      toast.error("Failed to send to X-ray room.");
    }
  };

  // Add auto-save on tab change
  const handleTabChangeWithAutoSave = async (nextStep: string) => {
    if (currentStep === 'treatment' && nextStep !== 'treatment') {
      // Only save if leaving the treatment tab
      await handleSaveProgress();
    }
    setCurrentStep(nextStep);
  };

  // Don't show consultation workflow for admins - they should only view
  if (isAdmin) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Consultation Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              As an admin, you can view patient information but cannot start or modify consultations. 
              Only doctors can perform consultations.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You will receive notifications when doctors complete consultations and payment collection is required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      {activeConsultation.appointment_id && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Consultation started from scheduled appointment</span>
              </div>
              {(activeConsultation.status === 'waiting-xray' || activeConsultation.status === 'xray-done') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshConsultation}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh X-ray Status'}
                </Button>
              )}
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
        onStepChange={handleTabChangeWithAutoSave}
        consultationData={consultationData}
        onUpdateField={updateField}
        patientName={patientName}
        patientId={patientId}
        consultationStatus={activeConsultation?.status}
        onSendToXRay={handleSendToXRay}
        xrayResult={activeConsultation?.xray_result ?? null}
        selectedAppointment={selectedAppointment || ''}
        patientType={patient?.patientType}
        patientInsurance={patient?.insurance}
      />
    </div>
  );
};

export default ConsultationWorkflow;
