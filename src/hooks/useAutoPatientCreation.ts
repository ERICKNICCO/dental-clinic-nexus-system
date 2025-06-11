
import { useState, useEffect } from 'react';
import { usePatients } from './usePatients';
import { useAppointments } from './useAppointments';

export const useAutoPatientCreation = () => {
  const [processedAppointments, setProcessedAppointments] = useState(new Set<string>());
  const { patients, loading: patientsLoading, addPatient } = usePatients();
  const { appointments, loading: appointmentsLoading } = useAppointments();

  useEffect(() => {
    const autoAddPatientsFromAppointments = async () => {
      if (!appointments || !patients || appointmentsLoading || patientsLoading) return;

      // Filter appointments to only include "Approved" status
      const approvedAppointments = appointments.filter(appointment => 
        appointment.status === 'Approved'
      );

      // Create a set of existing patient names (case-insensitive and trimmed)
      const existingPatientNames = new Set(
        patients.map(p => p.name.toLowerCase().trim())
      );
      
      // Create a map to track unique patient names from approved appointments
      const uniqueApprovedPatients = new Map<string, any>();
      
      // First pass: collect unique patients from approved appointments only
      for (const appointment of approvedAppointments) {
        const patientName = appointment.patient.name?.trim();
        if (patientName) {
          const lowerName = patientName.toLowerCase();
          // Check if patient doesn't exist and hasn't been processed yet
          if (!existingPatientNames.has(lowerName) && 
              !uniqueApprovedPatients.has(lowerName) &&
              !processedAppointments.has(appointment.id)) {
            uniqueApprovedPatients.set(lowerName, {
              name: patientName,
              email: appointment.patient.email || '',
              phone: appointment.patient.phone || '',
              appointmentId: appointment.id
            });
          }
        }
      }
      
      // Second pass: add unique patients from approved appointments that don't exist
      for (const [lowerName, patientData] of uniqueApprovedPatients) {
        console.log(`Auto-adding patient from approved appointment: ${patientData.name}`);
        
        try {
          await addPatient({
            name: patientData.name,
            email: patientData.email,
            phone: patientData.phone,
            dateOfBirth: new Date().toISOString().split('T')[0], // Default date
            gender: 'Not specified',
            address: '',
            emergencyContact: '',
            emergencyPhone: '',
            insurance: 'NHIF', // Default insurance
            patientType: 'insurance'
          });
          
          // Mark this appointment as processed
          setProcessedAppointments(prev => new Set(prev).add(patientData.appointmentId));
          
          // Add to existing names to prevent further duplicates in this session
          existingPatientNames.add(lowerName);
        } catch (error) {
          console.error(`Error auto-adding patient ${patientData.name}:`, error);
        }
      }
    };

    autoAddPatientsFromAppointments();
  }, [appointments, patients, appointmentsLoading, patientsLoading, addPatient, processedAppointments]);

  return { processedAppointments };
};
