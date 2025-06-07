
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  condition: string;
  description: string;
  treatment: string;
  doctor: string;
  createdAt: Date;
  updatedAt: Date;
}

export const medicalHistoryService = {
  // Add a new medical record
  async addMedicalRecord(recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('Attempting to add medical record to Firebase:', recordData);
      console.log('Database instance:', db);
      
      const docRef = await addDoc(collection(db, 'medicalHistory'), {
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Successfully added medical record with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding medical record:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // Get medical records for a patient
  async getPatientMedicalHistory(patientId: string) {
    try {
      console.log('Fetching medical history for patient:', patientId);
      // Use simple query without orderBy to avoid index requirements
      const q = query(
        collection(db, 'medicalHistory'), 
        where('patientId', '==', patientId)
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as MedicalRecord[];
      
      // Sort in JavaScript instead of Firebase
      const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Fetched medical records:', sortedRecords);
      return sortedRecords;
    } catch (error) {
      console.error('Error fetching medical history:', error);
      throw error;
    }
  },

  // Subscribe to real-time medical history updates
  subscribeToPatientMedicalHistory(patientId: string, callback: (records: MedicalRecord[]) => void) {
    console.log('Setting up real-time subscription for patient:', patientId);
    // Use simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, 'medicalHistory'), 
      where('patientId', '==', patientId)
    );
    return onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as MedicalRecord[];
      
      // Sort in JavaScript instead of Firebase
      const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Real-time update - received medical records:', sortedRecords);
      callback(sortedRecords);
    }, (error) => {
      console.error('Error in real-time subscription:', error);
      // If real-time fails, try to fetch data manually
      console.log('Real-time subscription failed, attempting manual fetch...');
      medicalHistoryService.getPatientMedicalHistory(patientId)
        .then(records => {
          console.log('Manual fetch successful:', records);
          callback(records);
        })
        .catch(fetchError => {
          console.error('Manual fetch also failed:', fetchError);
          callback([]);
        });
    });
  },

  // Update a medical record
  async updateMedicalRecord(id: string, updates: Partial<MedicalRecord>) {
    try {
      const recordRef = doc(db, 'medicalHistory', id);
      await updateDoc(recordRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  },

  // Delete a medical record
  async deleteMedicalRecord(id: string) {
    try {
      await deleteDoc(doc(db, 'medicalHistory', id));
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  }
};
