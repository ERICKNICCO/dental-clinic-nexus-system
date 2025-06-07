
import { useState, useEffect } from 'react';
import { treatmentNotesService, TreatmentNote } from '../services/treatmentNotesService';

export const useTreatmentNotes = (patientId: string) => {
  const [notes, setNotes] = useState<TreatmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      console.log('useTreatmentNotes: No patientId provided, setting loading to false');
      setLoading(false);
      setError('No patient ID provided');
      return;
    }

    console.log('useTreatmentNotes: Setting up treatment notes subscription for patient:', patientId);
    setLoading(true);
    setError(null);
    
    try {
      const unsubscribe = treatmentNotesService.subscribeToPatientTreatmentNotes(patientId, (notesList) => {
        console.log('useTreatmentNotes: Received treatment notes from Firebase:', notesList);
        console.log('useTreatmentNotes: Notes count:', notesList.length);
        // Force re-render by creating a new array
        setNotes([...notesList]);
        setLoading(false);
        setError(null);
      });

      return () => {
        console.log('useTreatmentNotes: Cleaning up treatment notes subscription');
        unsubscribe();
      };
    } catch (err) {
      console.error('useTreatmentNotes: Error setting up treatment notes subscription:', err);
      setLoading(false);
      setError('Failed to load treatment notes');
      setNotes([]);
    }
  }, [patientId]);

  // Manual refresh function
  const refreshNotes = async () => {
    if (!patientId) return;
    
    try {
      console.log('useTreatmentNotes: Manual refresh triggered');
      setLoading(true);
      const notesList = await treatmentNotesService.getPatientTreatmentNotes(patientId);
      console.log('useTreatmentNotes: Manual refresh result:', notesList);
      setNotes([...notesList]); // Force re-render with new array
      setLoading(false);
    } catch (err) {
      console.error('useTreatmentNotes: Error during manual refresh:', err);
      setLoading(false);
    }
  };

  const addNote = async (noteData: Omit<TreatmentNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useTreatmentNotes: Adding treatment note:', noteData);
      const noteId = await treatmentNotesService.addTreatmentNote(noteData);
      console.log('useTreatmentNotes: Note added with ID:', noteId);
      
      // Force refresh immediately after adding
      await refreshNotes();
      
    } catch (err) {
      console.error('useTreatmentNotes: Error adding treatment note:', err);
      setError('Failed to add treatment note');
      throw err;
    }
  };

  const updateNote = async (id: string, updates: Partial<TreatmentNote>) => {
    try {
      console.log('useTreatmentNotes: Updating treatment note:', id, updates);
      await treatmentNotesService.updateTreatmentNote(id, updates);
      
      // Force refresh after updating
      await refreshNotes();
    } catch (err) {
      console.error('useTreatmentNotes: Error updating treatment note:', err);
      setError('Failed to update treatment note');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      console.log('useTreatmentNotes: Deleting treatment note:', id);
      await treatmentNotesService.deleteTreatmentNote(id);
      
      // Force refresh after deleting
      await refreshNotes();
    } catch (err) {
      console.error('useTreatmentNotes: Error deleting treatment note:', err);
      setError('Failed to delete treatment note');
      throw err;
    }
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes
  };
};
