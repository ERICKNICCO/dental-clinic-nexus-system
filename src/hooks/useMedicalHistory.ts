
import { useState, useEffect } from 'react';
import { medicalHistoryService, MedicalRecord } from '../services/medicalHistoryService';

export const useMedicalHistory = (patientId: string) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
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
      medicalHistoryService.getPatientMedicalHistory(patientId)
        .then(records => {
          console.log('Manual fetch successful after timeout:', records);
          setRecords(records);
          setLoading(false);
          setError(null);
        })
        .catch(err => {
          console.error('Manual fetch failed:', err);
          setLoading(false);
          setRecords([]);
        });
    }, 5000); // Reduced to 5 seconds

    try {
      const unsubscribe = medicalHistoryService.subscribeToPatientMedicalHistory(patientId, (recordsList) => {
        console.log('Received medical records from Firebase:', recordsList);
        clearTimeout(loadingTimeout);
        setRecords(recordsList);
        setLoading(false);
        setError(null);
      });

      return () => {
        console.log('Cleaning up medical history subscription');
        clearTimeout(loadingTimeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up medical history subscription:', err);
      clearTimeout(loadingTimeout);
      setLoading(false);
      setError('Failed to load medical history');
      setRecords([]);
    }
  }, [patientId]);

  const addRecord = async (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding medical record:', recordData);
      console.log('Patient ID being used:', recordData.patientId);
      const recordId = await medicalHistoryService.addMedicalRecord(recordData);
      console.log('Successfully added record with ID:', recordId);
      
      // Manually refresh the records after adding
      try {
        const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        setRecords(updatedRecords);
        console.log('Records refreshed after adding new record:', updatedRecords);
      } catch (refreshError) {
        console.error('Failed to refresh records after adding:', refreshError);
      }
    } catch (err) {
      console.error('Error adding medical record:', err);
      setError('Failed to add medical record: ' + err.message);
      throw err;
    }
  };

  const updateRecord = async (id: string, updates: Partial<MedicalRecord>) => {
    try {
      console.log('Updating medical record:', id, updates);
      await medicalHistoryService.updateMedicalRecord(id, updates);
      
      // Manually refresh the records after updating
      try {
        const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        setRecords(updatedRecords);
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
      await medicalHistoryService.deleteMedicalRecord(id);
      
      // Manually refresh the records after deleting
      try {
        const updatedRecords = await medicalHistoryService.getPatientMedicalHistory(patientId);
        setRecords(updatedRecords);
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
