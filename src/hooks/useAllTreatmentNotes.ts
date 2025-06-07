
import { useState, useEffect } from 'react';
import { treatmentNotesService, TreatmentNote } from '../services/treatmentNotesService';
import { usePatients } from './usePatients';

interface TreatmentNoteWithPatient extends TreatmentNote {
  patientName: string;
}

export const useAllTreatmentNotes = () => {
  const [allNotes, setAllNotes] = useState<TreatmentNoteWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { patients } = usePatients();

  useEffect(() => {
    const fetchAllNotes = async () => {
      console.log('useAllTreatmentNotes: Starting fetchAllNotes');
      console.log('useAllTreatmentNotes: Patients data:', patients);
      console.log('useAllTreatmentNotes: Patients count:', patients.length);
      
      if (patients.length === 0) {
        console.log('useAllTreatmentNotes: No patients found, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('useAllTreatmentNotes: Fetching notes for', patients.length, 'patients');
        setLoading(true);
        
        const allNotesPromises = patients.map(async (patient) => {
          try {
            console.log(`useAllTreatmentNotes: Fetching notes for patient ${patient.id} (${patient.name})`);
            const notes = await treatmentNotesService.getPatientTreatmentNotes(patient.id);
            console.log(`useAllTreatmentNotes: Found ${notes.length} notes for patient ${patient.name}`);
            
            const notesWithPatientName = notes.map(note => ({
              ...note,
              patientName: patient.name
            }));
            
            console.log(`useAllTreatmentNotes: Notes with patient name for ${patient.name}:`, notesWithPatientName);
            return notesWithPatientName;
          } catch (error) {
            console.error(`useAllTreatmentNotes: Error fetching notes for patient ${patient.id}:`, error);
            return [];
          }
        });

        console.log('useAllTreatmentNotes: Waiting for all promises to resolve...');
        const notesArrays = await Promise.all(allNotesPromises);
        console.log('useAllTreatmentNotes: All promises resolved, notesArrays:', notesArrays);
        
        const flattenedNotes = notesArrays.flat();
        console.log('useAllTreatmentNotes: Flattened notes:', flattenedNotes);
        console.log('useAllTreatmentNotes: Total notes fetched:', flattenedNotes.length);
        
        setAllNotes(flattenedNotes);
        setError(null);
        console.log('useAllTreatmentNotes: State updated with notes');
      } catch (err) {
        console.error('useAllTreatmentNotes: Error fetching all treatment notes:', err);
        setError('Failed to load treatment notes');
      } finally {
        setLoading(false);
        console.log('useAllTreatmentNotes: Loading set to false');
      }
    };

    fetchAllNotes();
  }, [patients]);

  console.log('useAllTreatmentNotes: Returning data - allNotes:', allNotes, 'loading:', loading, 'error:', error);

  return {
    allNotes,
    loading,
    error
  };
};
