
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled'; // UPDATED: add waiting-xray and xray-done

  // Consultation steps
  symptoms: string;
  examination: string;
  vitalSigns: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    height?: string;
  };
  diagnosis: string;
  treatmentPlan: string;
  prescriptions: string;
  followUpInstructions: string;
  nextAppointment?: string;

  // Treatment cost information
  estimatedCost?: number;
  treatmentItems?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;

  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Add the xrayResult field
  xrayResult?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
}

// Helper function to remove undefined values
const removeUndefinedValues = (obj: any) => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

export const consultationService = {
  // Start a new consultation
  async startConsultation(consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'startedAt'>) {
    try {
      console.log('Starting new consultation:', consultationData);
      
      const dataToSave = removeUndefinedValues({
        ...consultationData,
        startedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const docRef = await addDoc(collection(db, 'consultations'), dataToSave);
      
      console.log('Consultation started with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }
  },

  // Update consultation data
  async updateConsultation(id: string, updates: Partial<Consultation>) {
    try {
      console.log('Updating consultation:', id, updates);
      const consultationRef = doc(db, 'consultations', id);
      
      const dataToUpdate = removeUndefinedValues({
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      await updateDoc(consultationRef, dataToUpdate);
      console.log('Consultation updated successfully');
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  },

  // Complete consultation
  async completeConsultation(id: string, finalData: Partial<Consultation>) {
    try {
      console.log('Completing consultation:', id);
      const consultationRef = doc(db, 'consultations', id);
      
      const dataToUpdate = removeUndefinedValues({
        ...finalData,
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      await updateDoc(consultationRef, dataToUpdate);
      console.log('Consultation completed successfully');
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }
  },

  // Get consultations for a patient
  async getPatientConsultations(patientId: string) {
    try {
      console.log('Fetching consultations for patient:', patientId);
      const q = query(
        collection(db, 'consultations'), 
        where('patientId', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      const consultations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as Consultation[];
      
      // Sort by most recent first
      consultations.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      
      console.log('Fetched consultations:', consultations);
      return consultations;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  }
};
