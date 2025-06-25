
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../integrations/supabase/client';

export interface TreatmentNote {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  procedure: string;
  notes: string;
  followUp: string;
  doctor: string;
  createdAt: Date;
  updatedAt: Date;
}

export const treatmentNotesService = {
  // Add a new treatment note to Supabase
  async addNote(note: Omit<TreatmentNote, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('Adding treatment note to Supabase:', note);
      
      // Ensure we have patient name
      let patientName = note.patientName;
      if (!patientName && note.patientId) {
        // Try to get patient name from patients table
        const { data: patient } = await supabase
          .from('patients')
          .select('name')
          .eq('id', note.patientId)
          .single();
        
        if (patient) {
          patientName = patient.name;
        }
      }
      
      const { data, error } = await supabase
        .from('treatment_notes')
        .insert([{
          patient_id: note.patientId,
          date: note.date,
          procedure: note.procedure,
          notes: note.notes,
          follow_up: note.followUp,
          doctor: note.doctor
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding treatment note to Supabase:', error);
        throw error;
      }

      console.log('Treatment note added to Supabase successfully:', data);
      return {
        id: data.id,
        patientId: data.patient_id,
        patientName: patientName || 'Unknown Patient',
        date: data.date,
        procedure: data.procedure,
        notes: data.notes,
        followUp: data.follow_up,
        doctor: data.doctor,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      } as TreatmentNote;
    } catch (error) {
      console.error('Error in addNote:', error);
      throw error;
    }
  },

  // Get all treatment notes for a patient from Supabase
  async getNotes(patientId: string): Promise<TreatmentNote[]> {
    try {
      console.log('Fetching treatment notes from Supabase for patient:', patientId);
      
      const { data, error } = await supabase
        .from('treatment_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching treatment notes from Supabase:', error);
        throw error;
      }

      // Get patient name for display
      let patientName = 'Unknown Patient';
      const { data: patient } = await supabase
        .from('patients')
        .select('name')
        .eq('id', patientId)
        .single();
      
      if (patient) {
        patientName = patient.name;
      }

      const notes = data.map(note => ({
        id: note.id,
        patientId: note.patient_id,
        patientName: patientName,
        date: note.date,
        procedure: note.procedure,
        notes: note.notes || '',
        followUp: note.follow_up || '',
        doctor: note.doctor,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at)
      })) as TreatmentNote[];

      console.log('Fetched treatment notes from Supabase:', notes);
      return notes;
    } catch (error) {
      console.error('Error in getNotes:', error);
      throw error;
    }
  },

  // Get all treatment notes from Supabase (for admin view)
  async getAllNotes(): Promise<TreatmentNote[]> {
    try {
      console.log('Fetching all treatment notes from Supabase');
      
      const { data, error } = await supabase
        .from('treatment_notes')
        .select(`
          *,
          patients!inner(name)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching all treatment notes from Supabase:', error);
        throw error;
      }

      const notes = data.map(note => ({
        id: note.id,
        patientId: note.patient_id,
        patientName: note.patients?.name || 'Unknown Patient',
        date: note.date,
        procedure: note.procedure,
        notes: note.notes || '',
        followUp: note.follow_up || '',
        doctor: note.doctor,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at)
      })) as TreatmentNote[];

      console.log('Fetched all treatment notes from Supabase:', notes);
      return notes;
    } catch (error) {
      console.error('Error in getAllNotes:', error);
      throw error;
    }
  },

  // Update a treatment note in Supabase
  async updateNote(id: string, updates: Partial<TreatmentNote>) {
    try {
      console.log('Updating treatment note in Supabase:', id, updates);
      
      const updateData: any = {};
      if (updates.procedure !== undefined) updateData.procedure = updates.procedure;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.followUp !== undefined) updateData.follow_up = updates.followUp;
      if (updates.doctor !== undefined) updateData.doctor = updates.doctor;
      if (updates.date !== undefined) updateData.date = updates.date;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('treatment_notes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating treatment note in Supabase:', error);
        throw error;
      }

      console.log('Treatment note updated in Supabase successfully');
    } catch (error) {
      console.error('Error in updateNote:', error);
      throw error;
    }
  },

  // Delete a treatment note from Supabase
  async deleteNote(id: string) {
    try {
      console.log('Deleting treatment note from Supabase:', id);
      
      const { error } = await supabase
        .from('treatment_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting treatment note from Supabase:', error);
        throw error;
      }

      console.log('Treatment note deleted from Supabase successfully');
    } catch (error) {
      console.error('Error in deleteNote:', error);
      throw error;
    }
  }
};
