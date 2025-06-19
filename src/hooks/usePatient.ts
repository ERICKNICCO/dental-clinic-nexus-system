
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  lastVisit: string;
  nextAppointment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const usePatient = (patientId: string | undefined) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'patients', patientId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('usePatient: Patient data from Firebase:', data);
          setPatient({
            id: doc.id,
            ...data
          } as Patient);
        } else {
          setError('Patient not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching patient:', error);
        setError('Failed to fetch patient data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId]);

  return { patient, loading, error };
};
