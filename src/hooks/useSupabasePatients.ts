
import { useState, useEffect } from 'react';
import { supabasePatientService } from '../services/supabasePatientService';
import { Patient } from '../types/patient';
import { useToast } from './use-toast';

interface NewPatient {
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
}

export const useSupabasePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients from Supabase...');
        setLoading(true);
        const patientsData = await supabasePatientService.getPatients();
        console.log('Fetched patients:', patientsData);
        setPatients(patientsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch patients');
        toast({
          title: "Error",
          description: "Failed to fetch patients from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [toast]);

  const generatePatientId = async (): Promise<string> => {
    try {
      console.log('Generating patient ID...');
      const allPatients = await supabasePatientService.getPatients();
      
      let highestNumber = 0;
      
      allPatients.forEach((patient) => {
        console.log('Checking patient:', patient.name, 'with patientId:', patient.patientId);
        if (patient.patientId) {
          // Extract number from format SD-25-XXXXX
          const match = patient.patientId.match(/SD-25-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            console.log('Found existing ID number:', number);
            if (number > highestNumber) {
              highestNumber = number;
            }
          }
        }
      });
      
      // Generate next patient ID
      const nextNumber = highestNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(5, '0');
      const newPatientId = `SD-25-${paddedNumber}`;
      console.log('Generated new patient ID:', newPatientId);
      return newPatientId;
    } catch (error) {
      console.error('Error generating patient ID:', error);
      // Fallback to a default starting ID
      return 'SD-25-00001';
    }
  };

  const findExistingPatient = async (patientData: { name: string; email?: string; phone: string }): Promise<Patient | null> => {
    try {
      const allPatients = await supabasePatientService.getPatients();
      
      // Check for exact name match first
      const nameMatch = allPatients.find(p => p.name.toLowerCase() === patientData.name.toLowerCase());
      if (nameMatch) return nameMatch;
      
      // Check for phone match
      const phoneMatch = allPatients.find(p => p.phone === patientData.phone);
      if (phoneMatch) return phoneMatch;
      
      // Check for email match if email is provided
      if (patientData.email) {
        const emailMatch = allPatients.find(p => p.email.toLowerCase() === patientData.email.toLowerCase());
        if (emailMatch) return emailMatch;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing patient:', error);
      return null;
    }
  };

  const addPatient = async (newPatientData: NewPatient) => {
    try {
      console.log('useSupabasePatients: Adding patient with data:', newPatientData);
      
      // Check if patient already exists
      const existingPatient = await findExistingPatient({
        name: newPatientData.name,
        email: newPatientData.email,
        phone: newPatientData.phone
      });
      
      if (existingPatient) {
        throw new Error(`A patient with the same name, email, or phone already exists: ${existingPatient.name} (ID: ${existingPatient.patientId})`);
      }

      const patientId = await generatePatientId();
      
      const patientToAdd = {
        patientId: patientId,
        name: newPatientData.name,
        email: newPatientData.email,
        phone: newPatientData.phone,
        dateOfBirth: newPatientData.dateOfBirth,
        gender: newPatientData.gender,
        address: newPatientData.address,
        emergencyContact: newPatientData.emergencyContact,
        emergencyPhone: newPatientData.emergencyPhone,
        insurance: newPatientData.insurance,
        patientType: newPatientData.patientType,
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: '',
      };

      console.log('useSupabasePatients: Final patient data to save:', patientToAdd);
      
      const newPatientId = await supabasePatientService.addPatient(patientToAdd);
      console.log('useSupabasePatients: Patient added with ID:', newPatientId);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
      
      toast({
        title: "Patient Added",
        description: `${newPatientData.name} has been successfully added with ID: ${patientId}`,
      });
    } catch (error: unknown) {
      console.error('useSupabasePatients: Error adding patient:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add patient to database";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
    try {
      console.log('useSupabasePatients: Updating patient:', patientId, updates);
      await supabasePatientService.updatePatient(patientId, updates);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
      
      toast({
        title: "Patient Updated",
        description: "Patient information has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePatient = async (patientId: string) => {
    try {
      console.log('useSupabasePatients: Deleting patient:', patientId);
      await supabasePatientService.deletePatient(patientId);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
      
      toast({
        title: "Patient Deleted",
        description: "Patient has been successfully removed.",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Function to add patient from appointment when status becomes "Approved"
  const addPatientFromAppointment = async (appointmentData: {
    patient_name: string;
    patient_email?: string;
    patient_phone?: string;
  }) => {
    try {
      console.log('Adding patient from appointment:', appointmentData);
      
      // Check if patient already exists
      const existingPatient = await findExistingPatient({
        name: appointmentData.patient_name,
        email: appointmentData.patient_email || '',
        phone: appointmentData.patient_phone || ''
      });
      
      if (existingPatient) {
        console.log('Patient already exists:', existingPatient.name);
        return existingPatient;
      }

      // Create new patient with minimal information from appointment
      const patientId = await generatePatientId();
      
      const newPatient = {
        patientId: patientId,
        name: appointmentData.patient_name,
        email: appointmentData.patient_email || '',
        phone: appointmentData.patient_phone || '',
        dateOfBirth: '', // To be filled later
        gender: '', // To be filled later
        address: '', // To be filled later
        emergencyContact: '',
        emergencyPhone: '',
        insurance: '',
        patientType: 'cash' as const,
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: '',
      };

      console.log('Creating new patient from appointment:', newPatient);
      
      const newPatientId = await supabasePatientService.addPatient(newPatient);
      console.log('Patient created from appointment with ID:', newPatientId);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
      
      return newPatient;
    } catch (error) {
      console.error('Error adding patient from appointment:', error);
      throw error;
    }
  };

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    findExistingPatient,
    addPatientFromAppointment
  };
};
