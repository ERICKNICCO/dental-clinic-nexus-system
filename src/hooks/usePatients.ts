
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  getDocs,
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './use-toast';

interface Patient {
  id: string;
  patientId: string;
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

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePatientId = async (): Promise<string> => {
    try {
      console.log('Generating patient ID...');
      // Get all patients to find the highest patient ID
      const q = query(collection(db, 'patients'));
      const querySnapshot = await getDocs(q);
      
      let highestNumber = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Checking patient:', data.name, 'with patientId:', data.patientId);
        if (data.patientId) {
          // Extract number from format SD-25-XXXXX
          const match = data.patientId.match(/SD-25-(\d+)/);
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

  // New function to find existing patient by name, email, or phone
  const findExistingPatient = async (patientData: { name: string; email?: string; phone: string }): Promise<Patient | null> => {
    try {
      const patientsRef = collection(db, 'patients');
      
      // Check for exact name match first
      const nameQuery = query(patientsRef, where('name', '==', patientData.name));
      const nameSnapshot = await getDocs(nameQuery);
      
      if (!nameSnapshot.empty) {
        const existingDoc = nameSnapshot.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() } as Patient;
      }
      
      // Check for phone match
      const phoneQuery = query(patientsRef, where('phone', '==', patientData.phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        const existingDoc = phoneSnapshot.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() } as Patient;
      }
      
      // Check for email match if email is provided
      if (patientData.email) {
        const emailQuery = query(patientsRef, where('email', '==', patientData.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const existingDoc = emailSnapshot.docs[0];
          return { id: existingDoc.id, ...existingDoc.data() } as Patient;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing patient:', error);
      return null;
    }
  };

  const migrateExistingPatients = useCallback(async () => {
    try {
      console.log('Starting patient migration...');
      const q = query(collection(db, 'patients'));
      const querySnapshot = await getDocs(q);
      
      // First, find the highest existing patient ID number
      let highestNumber = 0;
      const patientsWithoutIds: { docId: string; data: DocumentData }[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.patientId) {
          // Extract number from existing IDs
          const match = data.patientId.match(/SD-25-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            if (number > highestNumber) {
              highestNumber = number;
            }
          }
        } else {
          patientsWithoutIds.push({ docId: docSnapshot.id, data });
        }
      });
      
      // Now assign sequential IDs to patients without IDs, starting after the highest existing number
      const updates: Promise<void>[] = [];
      let counter = highestNumber + 1;
      
      patientsWithoutIds.forEach(({ docId, data }) => {
        const paddedNumber = counter.toString().padStart(5, '0');
        const patientId = `SD-25-${paddedNumber}`;
        console.log(`Migrating patient ${data.name} to ID: ${patientId}`);
        
        const updatePromise = updateDoc(doc(db, 'patients', docId), {
          patientId: patientId,
          updatedAt: new Date()
        });
        updates.push(updatePromise);
        counter++;
      });
      
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Successfully migrated ${updates.length} patients`);
        toast({
          title: "Migration Complete",
          description: `Updated ${updates.length} patients with proper IDs`,
        });
      } else {
        console.log('No patients need migration');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      toast({
        title: "Migration Error",
        description: "Failed to migrate existing patients",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      async (querySnapshot) => {
        const patientsData: Patient[] = [];
        let needsMigration = false;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Patient from Firebase:', doc.id, 'patientId:', data.patientId, 'name:', data.name);
          
          if (!data.patientId) {
            needsMigration = true;
          }
          
          patientsData.push({
            id: doc.id,
            ...data
          } as Patient);
        });
        
        setPatients(patientsData);
        setLoading(false);
        setError(null);
        
        // Run migration if needed
        if (needsMigration && patientsData.length > 0) {
          console.log('Some patients need migration, running migration...');
          await migrateExistingPatients();
        }
      },
      (error) => {
        console.error('Error fetching patients:', error);
        setError('Failed to fetch patients');
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch patients from database",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [toast, migrateExistingPatients]);

  const addPatient = async (newPatientData: NewPatient) => {
    try {
      console.log('usePatients: Adding patient with data:', newPatientData);
      
      // Check if patient already exists
      const existingPatient = await findExistingPatient({
        name: newPatientData.name,
        email: newPatientData.email,
        phone: newPatientData.phone
      });
      
      if (existingPatient) {
        throw new Error(`A patient with the same name, email, or phone already exists: ${existingPatient.name} (ID: ${existingPatient.patientId})`);
      }

      const now = new Date();
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
        lastVisit: now.toISOString().split('T')[0],
        nextAppointment: null,
        createdAt: now,
        updatedAt: now,
      };

      console.log('usePatients: Final patient data to save:', patientToAdd);
      console.log('usePatients: PatientId being saved:', patientToAdd.patientId);
      
      const docRef = await addDoc(collection(db, 'patients'), patientToAdd);
      console.log('usePatients: Document written with ID: ', docRef.id);
      
      toast({
        title: "Patient Added",
        description: `${newPatientData.name} has been successfully added with ID: ${patientId}`,
      });
    } catch (error: unknown) {
      console.error('usePatients: Error adding patient:', error);
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
      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, {
        ...updates,
        updatedAt: new Date(),
      });
      
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
    }
  };

  const deletePatient = async (patientId: string) => {
    try {
      await deleteDoc(doc(db, 'patients', patientId));
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
    migrateExistingPatients,
  };
};
