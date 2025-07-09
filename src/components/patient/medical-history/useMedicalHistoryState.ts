
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { MedicalRecord } from '../../../types/medicalRecord';

export const useMedicalHistoryState = () => {
  const { userProfile } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    description: '',
    treatment: ''
  });
  const [editRecord, setEditRecord] = useState<Partial<MedicalRecord>>({});

  const resetNewRecord = () => {
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      condition: '',
      description: '',
      treatment: ''
    });
  };

  const startEditing = (record: MedicalRecord) => {
    setEditingRecordId(record.id);
    setEditRecord({
      date: record.date,
      condition: record.condition,
      description: record.description,
      treatment: record.treatment
    });
  };

  const cancelEditing = () => {
    setEditingRecordId(null);
    setEditRecord({});
  };

  return {
    userProfile,
    isAddingNew,
    setIsAddingNew,
    editingRecordId,
    setEditingRecordId,
    newRecord,
    setNewRecord,
    editRecord,
    setEditRecord,
    resetNewRecord,
    startEditing,
    cancelEditing
  };
};
