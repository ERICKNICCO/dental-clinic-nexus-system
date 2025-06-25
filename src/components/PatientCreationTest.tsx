
import React from 'react';
import { Button } from './ui/button';
import { useSupabaseAppointments } from '../hooks/useSupabaseAppointments';
import { useSupabasePatients } from '../hooks/useSupabasePatients';
import { useToast } from '../hooks/use-toast';

const PatientCreationTest = () => {
  const { appointments } = useSupabaseAppointments();
  const { addPatientFromAppointment } = useSupabasePatients();
  const { toast } = useToast();

  const handleCreatePatientsFromApproved = async () => {
    console.log('All appointments:', appointments);
    
    const approvedAppointments = appointments.filter(apt => apt.status === 'Approved');
    console.log('Approved appointments:', approvedAppointments);
    
    if (approvedAppointments.length === 0) {
      toast({
        title: "No Approved Appointments",
        description: "No approved appointments found to create patients from.",
        variant: "destructive",
      });
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const appointment of approvedAppointments) {
      try {
        console.log('Processing appointment:', appointment);
        await addPatientFromAppointment({
          patient_name: appointment.patient.name,
          patient_email: appointment.patient.email,
          patient_phone: appointment.patient.phone,
        });
        createdCount++;
        console.log(`Created patient from appointment: ${appointment.patient.name}`);
      } catch (error) {
        console.error(`Failed to create patient from appointment ${appointment.patient.name}:`, error);
        skippedCount++;
      }
    }

    toast({
      title: "Patient Creation Complete",
      description: `Created ${createdCount} patients, skipped ${skippedCount} (may already exist)`,
    });
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Manual Patient Creation</h3>
      <p className="text-sm text-yellow-700 mb-3">
        Click this button to manually create patients from all approved appointments.
      </p>
      <Button 
        onClick={handleCreatePatientsFromApproved}
        variant="outline"
        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
      >
        Create Patients from Approved Appointments
      </Button>
    </div>
  );
};

export default PatientCreationTest;
