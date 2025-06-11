import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Search, UserPlus, FileText, Loader2, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddPatientModal from './patient/AddPatientModal';
import EditPatientModal from './patient/EditPatientModal';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorAppointments } from '../hooks/useDoctorAppointments';
import { useAppointments } from '../hooks/useAppointments';
import { usePatientAutoCreation } from '../hooks/usePatientAutoCreation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface NewPatient {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  patientType: 'insurance' | 'cash';
}

interface Patient {
  id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  patientType: 'insurance' | 'cash';
  lastVisit: string;
  nextAppointment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PatientList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { patients, loading, error, addPatient, updatePatient, deletePatient } = usePatients();
  const { userProfile } = useAuth();
  const { todaysAppointments, loading: appointmentsLoading } = useDoctorAppointments(userProfile?.name || '');
  const { appointments } = useAppointments();
  
  // Use the auto-creation hook
  usePatientAutoCreation(appointments);

  // Filter patients to show only those assigned to the current doctor
  const getFilteredPatientsByDoctor = () => {
    if (userProfile?.role === 'admin') {
      // Admins can see all patients
      return patients;
    }

    if (!todaysAppointments || todaysAppointments.length === 0) {
      return [];
    }

    // Get unique patient names that have appointments with this doctor
    const doctorPatientNames = new Set(
      todaysAppointments.map(appointment => appointment.patient.name)
    );

    // Filter patients to only include those with appointments with this doctor
    return patients.filter(patient => doctorPatientNames.has(patient.name));
  };

  const doctorFilteredPatients = getFilteredPatientsByDoctor();

  // Filter patients based on search term
  const filteredPatients = doctorFilteredPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    (patient.patientId && patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPatient = async (newPatientData: NewPatient) => {
    console.log('PatientList: Handling add patient request');
    try {
      await addPatient(newPatientData);
      setIsAddModalOpen(false);
      console.log('PatientList: Patient added successfully');
    } catch (error) {
      console.error('PatientList: Error adding patient:', error);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (patientId: string, updates: Partial<Patient>) => {
    console.log('PatientList: Handling update patient request');
    try {
      await updatePatient(patientId, updates);
      setIsEditModalOpen(false);
      setSelectedPatient(null);
      console.log('PatientList: Patient updated successfully');
    } catch (error) {
      console.error('PatientList: Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    console.log('PatientList: Handling delete patient request for:', patientName);
    try {
      await deletePatient(patientId);
      console.log('PatientList: Patient deleted successfully');
    } catch (error) {
      console.error('PatientList: Error deleting patient:', error);
    }
  };

  const formatInsuranceProvider = (insurance: string) => {
    if (insurance.toLowerCase() === 'jubilee') {
      return 'Jubilee';
    }
    return insurance;
  };

  if (loading || appointmentsLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search patients..."
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="mr-2" />
          Add Patient
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Next Appointment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPatients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                {patient.patientId || 'ID Missing'}
              </TableCell>
              <TableCell className="font-medium">{patient.name}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  patient.patientType === 'insurance' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {patient.patientType === 'insurance' 
                    ? formatInsuranceProvider(patient.insurance) || 'Insurance' 
                    : 'Cash'}
                </span>
              </TableCell>
              <TableCell>{patient.email}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell>{new Date(patient.lastVisit).toLocaleDateString()}</TableCell>
              <TableCell>
                {patient.nextAppointment 
                  ? new Date(patient.nextAppointment).toLocaleDateString() 
                  : 'Not scheduled'}
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/patients/${patient.id}/file`}>
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    File
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEditPatient(patient)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {userProfile?.role === 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {patient.name}? This action cannot be undone.
                          All patient data, medical history, and treatment notes will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePatient(patient.id, patient.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Patient
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {filteredPatients.length === 0 && !loading && !appointmentsLoading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No patients found matching your search criteria.' : 
           userProfile?.role === 'admin' ? 'No patients found. Add your first patient!' :
           'No patients assigned to you yet. Patients will appear here after appointments are scheduled.'}
        </div>
      )}

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPatient={handleAddPatient}
      />

      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        onUpdatePatient={handleUpdatePatient}
        patient={selectedPatient}
      />
    </div>
  );
};

export default PatientList;
