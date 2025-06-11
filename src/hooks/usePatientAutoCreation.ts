
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './use-toast';

interface PatientData {
  fullName: string;
  phone: string;
  paymentMethod?: string;
}

export const checkIfPatientExists = async ({ fullName, phone }: { fullName: string; phone: string }): Promise<boolean> => {
  try {
    // Normalize the full name by trimming whitespace and converting to lowercase
    const normalizedName = fullName.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    console.log('Checking if patient exists:', { normalizedName, normalizedPhone });

    const patientsRef = collection(db, 'patients');
    
    // Query for patients with matching name (case-insensitive) and phone
    const nameQuery = query(patientsRef, where('name', '>=', normalizedName), where('name', '<=', normalizedName + '\uf8ff'));
    const nameSnapshot = await getDocs(nameQuery);
    
    // Check if any patient has both matching name and phone
    const existingPatient = nameSnapshot.docs.find(doc => {
      const data = doc.data();
      const patientName = data.name?.trim().toLowerCase();
      const patientPhone = data.phone?.trim();
      
      return patientName === normalizedName && patientPhone === normalizedPhone;
    });

    const exists = !!existingPatient;
    console.log('Patient exists:', exists);
    
    return exists;
  } catch (error) {
    console.error('Error checking if patient exists:', error);
    return false;
  }
};

export const usePatientAutoCreation = (appointments: any[]) => {
  const [processedAppointments, setProcessedAppointments] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const createPatientFromAppointment = async (appointment: any) => {
    try {
      const fullName = appointment.patient?.name || appointment.patient_name;
      const phone = appointment.patient?.phone || appointment.patient_phone;
      
      if (!fullName || !phone) {
        console.log('Missing patient name or phone, skipping auto-creation');
        return;
      }

      // Check if patient already exists
      const patientExists = await checkIfPatientExists({ fullName, phone });
      
      if (patientExists) {
        console.log('Patient already exists, skipping creation:', fullName);
        return;
      }

      // Create new patient
      const patientData = {
        name: fullName.trim(),
        email: appointment.patient?.email || appointment.patient_email || '',
        phone: phone.trim(),
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        insurance: '',
        patientType: 'cash' as const,
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Creating new patient from appointment:', patientData);
      
      await addDoc(collection(db, 'patients'), patientData);
      
      toast({
        title: "Patient Created",
        description: `${fullName} has been automatically added to the patient list.`,
      });

    } catch (error) {
      console.error('Error creating patient from appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create patient from appointment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!appointments || appointments.length === 0) return;

    const approvedAppointments = appointments.filter(appointment => 
      appointment.status === 'Approved' && !processedAppointments.has(appointment.id)
    );

    if (approvedAppointments.length === 0) return;

    console.log('Processing approved appointments for auto-patient creation:', approvedAppointments.length);

    const processAppointments = async () => {
      const newProcessedIds = new Set(processedAppointments);

      for (const appointment of approvedAppointments) {
        await createPatientFromAppointment(appointment);
        newProcessedIds.add(appointment.id);
      }

      setProcessedAppointments(newProcessedIds);
    };

    processAppointments();
  }, [appointments, processedAppointments, toast]);

  return { processedAppointments };
};
