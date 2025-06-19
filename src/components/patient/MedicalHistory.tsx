import React from 'react';
import { Button } from '../ui/button';
import { Plus, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useMedicalHistory } from '../../hooks/useMedicalHistory';
import { useMedicalHistoryState } from './medical-history/useMedicalHistoryState';
import MedicalRecordForm from './medical-history/MedicalRecordForm';
import MedicalRecordCard from './medical-history/MedicalRecordCard';

interface MedicalHistoryProps {
  patientId: string;
  isEditing: boolean;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ patientId, isEditing }) => {
  const { records, loading, error, addRecord, updateRecord, deleteRecord } = useMedicalHistory(patientId);
  const {
    userProfile,
    isAddingNew,
    setIsAddingNew,
    editingRecordId,
    newRecord,
    setNewRecord,
    editRecord,
    setEditRecord,
    resetNewRecord,
    startEditing,
    cancelEditing
  } = useMedicalHistoryState();

  console.log('MedicalHistory render - patientId:', patientId, 'loading:', loading, 'isEditing:', isEditing, 'records count:', records.length);

  const handleSaveRecord = async () => {
    try {
      console.log('Saving new medical record for patient:', patientId);
      console.log('Record data:', newRecord);
      console.log('User profile:', userProfile);
      
      const recordToSave = {
        ...newRecord,
        patientId,
        doctor: userProfile?.name || 'Unknown Doctor'
      };
      
      console.log('Final record to save:', recordToSave);
      
      await addRecord(recordToSave);
      setIsAddingNew(false);
      resetNewRecord();
      console.log('Successfully saved medical record');
    } catch (error) {
      console.error('Failed to save medical record:', error);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecordId) return;
    
    try {
      await updateRecord(editingRecordId, editRecord);
      cancelEditing();
    } catch (error) {
      console.error('Failed to update medical record:', error);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      try {
        await deleteRecord(recordId);
      } catch (error) {
        console.error('Failed to delete medical record:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
              <p className="text-sm text-gray-500">
                {records.length} {records.length === 1 ? 'record' : 'records'} on file
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAddingNew(true)} 
            disabled={isAddingNew || !isEditing}
            variant={isEditing ? "default" : "outline"}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Medical Record
          </Button>
        </div>
      </div>

      {/* New Record Form */}
      {isAddingNew && isEditing && (
        <div className="bg-white rounded-lg border">
          <MedicalRecordForm
            formData={newRecord}
            onFormDataChange={setNewRecord}
            onSave={handleSaveRecord}
            onCancel={() => {
              setIsAddingNew(false);
              resetNewRecord();
            }}
            title="New Medical Record"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Medical History</h3>
            <p className="text-gray-500">Please wait while we retrieve the patient's medical records...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Records</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Medical Records */}
      {!loading && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="bg-white rounded-lg border p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Records</h3>
                <p className="text-gray-500 mb-4">No medical history records found for this patient.</p>
                {isEditing && (
                  <Button onClick={() => setIsAddingNew(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Record
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <MedicalRecordCard
                  key={record.id}
                  record={record}
                  isEditing={editingRecordId === record.id}
                  editData={editRecord}
                  onEdit={() => startEditing(record)}
                  onSave={handleUpdateRecord}
                  onCancel={cancelEditing}
                  onDelete={() => handleDeleteRecord(record.id)}
                  onEditDataChange={setEditRecord}
                  canEdit={isEditing}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;
