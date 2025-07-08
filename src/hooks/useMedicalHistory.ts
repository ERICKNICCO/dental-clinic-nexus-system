
import { useState, useEffect } from 'react';
// Removed: import { medicalHistoryService, MedicalRecord } from '../services/medicalHistoryService';

export const useMedicalHistory = (patientId: string) => {
  const [records, setRecords] = useState<any[]>([]); // Changed type to any[] as MedicalRecord is removed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      console.log('No patientId provided, setting loading to false');
      setLoading(false);
      setError('No patient ID provided');
      return;
    }

    console.log('Setting up medical history subscription for patient:', patientId);
    setLoading(true);
    setError(null);
    
    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, attempting manual fetch');
      // Removed: medicalHistoryService.getPatientMedicalHistory(patientId)
      // Manually fetch or handle as a placeholder
      console.log('Manual fetch placeholder for patient:', patientId);
      setLoading(false);
      setError(null);
    }, 5000); // Reduced to 5 seconds

    try {
      // Removed: const unsubscribe = medicalHistoryService.subscribeToPatientMedicalHistory(patientId, (recordsList) => {
      // Manually fetch or handle as a placeholder
      console.log('Placeholder for medical history subscription for patient:', patientId);
      // setRecords(recordsList); // This line is removed as recordsList is not available here
      setLoading(false);
      setError(null);

      return () => {
        console.log('Cleaning up medical history subscription placeholder');
        clearTimeout(loadingTimeout);
        // Removed: unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up medical history subscription placeholder:', err);
      clearTimeout(loadingTimeout);
      setLoading(false);
      setError('Failed to load medical history');
      setRecords([]);
    }
  }, [patientId]);

  const addRecord = async (recordData: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) => { // Changed type to any
    try {
      console.log('Adding medical record:', recordData);
      console.log('Patient ID being used:', recordData.patientId);
      // Removed: const recordId = await medicalHistoryService.addMedicalRecord(recordData);
      console.log('Placeholder for adding medical record');
      
      // Manually refresh the records after adding
      try {
        // Removed: const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        console.log('Placeholder for refreshing records after adding');
        // setRecords(updatedRecords); // This line is removed as updatedRecords is not available here
      } catch (refreshError) {
        console.error('Failed to refresh records after adding:', refreshError);
      }
    } catch (err) {
      console.error('Error adding medical record:', err);
      setError('Failed to add medical record: ' + err.message);
      throw err;
    }
  };

  const updateRecord = async (id: string, updates: Partial<any>) => { // Changed type to any
    try {
      console.log('Updating medical record:', id, updates);
      // Removed: await medicalHistoryService.updateMedicalRecord(id, updates);
      console.log('Placeholder for updating medical record');
      
      // Manually refresh the records after updating
      try {
        // Removed: const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        console.log('Placeholder for refreshing records after updating');
        // setRecords(updatedRecords); // This line is removed as updatedRecords is not available here
      } catch (refreshError) {
        console.error('Failed to refresh records after updating:', refreshError);
      }
    } catch (err) {
      console.error('Error updating medical record:', err);
      setError('Failed to update medical record');
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      console.log('Deleting medical record:', id);
      // Removed: await medicalHistoryService.deleteMedicalRecord(id);
      console.log('Placeholder for deleting medical record');
      
      // Manually refresh the records after deleting
      try {
        // Removed: const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        console.log('Placeholder for refreshing records after deleting');
        // setRecords(updatedRecords); // This line is removed as updatedRecords is not available here
      } catch (refreshError) {
        console.error('Failed to refresh records after deleting:', refreshError);
      }
    } catch (err) {
      console.error('Error deleting medical record:', err);
      setError('Failed to delete medical record');
      throw err;
    }
  };

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord
  };
};
