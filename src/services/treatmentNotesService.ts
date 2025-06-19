
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TreatmentNote {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  procedure: string;
  notes: string;
  followUp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const treatmentNotesService = {
  // Add a new treatment note
  async addTreatmentNote(noteData: Omit<TreatmentNote, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('treatmentNotesService: Adding treatment note with data:', noteData);
      console.log('treatmentNotesService: Firebase db instance:', db);
      
      const docRef = await addDoc(collection(db, 'treatmentNotes'), {
        ...noteData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('treatmentNotesService: Successfully added treatment note with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('treatmentNotesService: Error adding treatment note:', error);
      console.error('treatmentNotesService: Error details:', error.message);
      throw error;
    }
  },

  // Get treatment notes for a patient
  async getPatientTreatmentNotes(patientId: string) {
    try {
      console.log('treatmentNotesService: Fetching treatment notes for patient:', patientId);
      
      // Simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'treatmentNotes'), 
        where('patientId', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('treatmentNotesService: Query snapshot size:', querySnapshot.size);
      
      const notes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('treatmentNotesService: Processing document:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as TreatmentNote[];
      
      // Sort by date in JavaScript
      notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('treatmentNotesService: Returning sorted notes:', notes);
      return notes;
    } catch (error) {
      console.error('treatmentNotesService: Error fetching treatment notes:', error);
      throw error;
    }
  },

  // Subscribe to real-time treatment notes updates
  subscribeToPatientTreatmentNotes(patientId: string, callback: (notes: TreatmentNote[]) => void) {
    console.log('treatmentNotesService: Setting up subscription for patient:', patientId);
    
    try {
      // Simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'treatmentNotes'), 
        where('patientId', '==', patientId)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        console.log('treatmentNotesService: Received snapshot update, size:', querySnapshot.size);
        
        const notes = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        }) as TreatmentNote[];
        
        // Sort by date in JavaScript
        notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log('treatmentNotesService: Calling callback with notes:', notes);
        callback(notes);
      }, (error) => {
        console.error('treatmentNotesService: Subscription error:', error);
        // Fallback to manual fetch
        this.getPatientTreatmentNotes(patientId).then(callback).catch(console.error);
      });
    } catch (error) {
      console.error('treatmentNotesService: Error setting up subscription:', error);
      throw error;
    }
  },

  // Update a treatment note
  async updateTreatmentNote(id: string, updates: Partial<TreatmentNote>) {
    try {
      console.log('treatmentNotesService: Updating treatment note:', id, updates);
      const noteRef = doc(db, 'treatmentNotes', id);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('treatmentNotesService: Successfully updated treatment note:', id);
    } catch (error) {
      console.error('treatmentNotesService: Error updating treatment note:', error);
      throw error;
    }
  },

  // Delete a treatment note
  async deleteTreatmentNote(id: string) {
    try {
      console.log('treatmentNotesService: Deleting treatment note:', id);
      await deleteDoc(doc(db, 'treatmentNotes', id));
      console.log('treatmentNotesService: Successfully deleted treatment note:', id);
    } catch (error) {
      console.error('treatmentNotesService: Error deleting treatment note:', error);
      throw error;
    }
  }
};
