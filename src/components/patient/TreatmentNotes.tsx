
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Plus, Save, X, Loader2, Calendar, User, FileText, Stethoscope } from 'lucide-react';
import { useTreatmentNotes } from '../../hooks/useTreatmentNotes';
import { useAuth } from '../../contexts/AuthContext';

interface TreatmentNotesProps {
  patientId: string;
  patientName?: string;
  isEditing: boolean;
}

const TreatmentNotes: React.FC<TreatmentNotesProps> = ({ patientId, patientName, isEditing }) => {
  const { notes, loading, error, addNote } = useTreatmentNotes(patientId);
  const { userProfile } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNote, setNewNote] = useState({
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    notes: '',
    followUp: ''
  });

  console.log('TreatmentNotes render - patientId:', patientId, 'loading:', loading, 'isEditing:', isEditing, 'notes count:', notes.length);

  const handleSaveNote = async () => {
    try {
      console.log('Saving new treatment note for patient:', patientId);
      console.log('Note data:', newNote);
      console.log('User profile:', userProfile);
      
      const noteToSave = {
        ...newNote,
        patientId,
        patientName: patientName || 'Unknown Patient',
        doctor: userProfile?.name || 'Unknown Doctor'
      };
      
      console.log('Final note to save:', noteToSave);
      
      await addNote(noteToSave);
      setIsAddingNew(false);
      setNewNote({
        date: new Date().toISOString().split('T')[0],
        procedure: '',
        notes: '',
        followUp: ''
      });
      console.log('Successfully saved treatment note');
    } catch (error) {
      console.error('Failed to save treatment note:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Treatment Notes</h2>
              <p className="text-sm text-gray-500">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} on file
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
            Add Treatment Note
          </Button>
        </div>
      </div>

      {/* New Note Form */}
      {isAddingNew && isEditing && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">New Treatment Note</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-date" className="text-sm font-medium text-gray-700">
                  Date
                </Label>
                <Input 
                  id="note-date" 
                  type="date" 
                  value={newNote.date}
                  onChange={(e) => setNewNote({...newNote, date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="note-procedure" className="text-sm font-medium text-gray-700">
                  Procedure
                </Label>
                <Input 
                  id="note-procedure" 
                  placeholder="Enter procedure name"
                  value={newNote.procedure}
                  onChange={(e) => setNewNote({...newNote, procedure: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="note-content" className="text-sm font-medium text-gray-700">
                Treatment Notes
              </Label>
              <Textarea 
                id="note-content" 
                placeholder="Enter detailed treatment notes..." 
                rows={4}
                value={newNote.notes}
                onChange={(e) => setNewNote({...newNote, notes: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="note-followup" className="text-sm font-medium text-gray-700">
                Follow-up Instructions
              </Label>
              <Textarea 
                id="note-followup" 
                placeholder="Enter follow-up instructions..." 
                rows={2}
                value={newNote.followUp}
                onChange={(e) => setNewNote({...newNote, followUp: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddingNew(false);
                setNewNote({
                  date: new Date().toISOString().split('T')[0],
                  procedure: '',
                  notes: '',
                  followUp: ''
                });
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveNote}>
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Treatment Notes</h3>
            <p className="text-gray-500">Please wait while we retrieve the treatment notes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-red-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notes</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Treatment Notes */}
      {!loading && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="bg-white rounded-lg border p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Treatment Notes</h3>
                <p className="text-gray-500 mb-4">No treatment notes found for this patient.</p>
                {isEditing && (
                  <Button onClick={() => setIsAddingNew(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Note
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-green-600" />
                          {note.procedure}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(note.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{note.doctor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Treatment Notes
                        </Label>
                        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500 mt-2">
                          <p className="text-gray-700 leading-relaxed">{note.notes}</p>
                        </div>
                      </div>
                      
                      {note.followUp && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Follow-up Instructions
                          </Label>
                          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 mt-2">
                            <p className="text-blue-700 leading-relaxed">{note.followUp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TreatmentNotes;

