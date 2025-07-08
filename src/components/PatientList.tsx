import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Search, UserPlus, FileText, Loader2, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddPatientModal from './patient/AddPatientModal';
import EditPatientModal from './patient/EditPatientModal';
import { useSupabasePatients } from '../hooks/useSupabasePatients';
import { useAuth } from '../contexts/AuthContext';
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
import { useSupabaseAppointments } from '../hooks/useSupabaseAppointments';
import { Patient } from '../types/patient';

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

const PatientList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { patients: rawPatients, loading, error, addPatient, updatePatient, deletePatient, refreshPatients } = useSupabasePatients();
  const { userProfile } = useAuth();
  const { appointments, refreshAppointments } = useSupabaseAppointments();
  const patients: Patient[] = rawPatients as Patient[];

  console.log('PatientList: Current patients:', patients);
  console.log('PatientList: Loading state:', loading);
  console.log('PatientList: Error state:', error);
  console.log('PatientList: patients from main table:', patients.map(p => p.patientId));

  // Merge patients from the patients table and from appointments
  const appointmentPatients: Patient[] = appointments
    .map(a => {
      const p: any = a.patient || {};
      return {
        id: a.patientId || a.patient_id || p?.id || '',
        patientId: a.patientId || a.patient_id || p?.patientId || '',
        name: p?.name || a.patient_name || '',
        email: p?.email || a.patient_email || '',
        phone: p?.phone || a.patient_phone || '',
        dateOfBirth: p?.dateOfBirth || '',
        gender: p?.gender || '',
        address: p?.address || '',
        emergencyContact: p?.emergencyContact || '',
        emergencyPhone: p?.emergencyPhone || '',
        insurance: a.insurance || p?.insurance || '',
        lastVisit: '',
        nextAppointment: '',
        patientType: a.patientType || p?.patientType || 'cash',
      } as Patient;
    })
    .filter((p: any) => p.id);

  // Combine and deduplicate patients by email (fallback to phone)
  const dedupedPatientsMap = new Map();
  [...patients, ...appointmentPatients].forEach(p => {
    if (p) {
      const key = p.email ? p.email.toLowerCase() : (p.phone || '').replace(/\D/g, '');
      if (key && !dedupedPatientsMap.has(key)) {
        dedupedPatientsMap.set(key, p);
      }
    }
  });
  let filteredPatients = Array.from(dedupedPatientsMap.values());

  // Filter patients based on search term
  filteredPatients = filteredPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    (patient.patientId && patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // If doctor, further filter to only patients with appointments with this doctor
  if (userProfile?.role === 'doctor') {
    const doctorPatientIds = new Set(
      appointments.map(a => (a.patient && (a.patient.id || a.patient.patientId)) || a.patient_id)
    );
    filteredPatients = filteredPatients.filter(p => doctorPatientIds.has(p.id || p.patientId));
  }

  const mainPatientIds = new Set(patients.map(p => p.patientId));
  console.log('PatientList: mainPatientIds set:', Array.from(mainPatientIds));
  console.log('PatientList: filteredPatients before mainPatientIds filter:', filteredPatients.map(p => p.patientId));
  // filteredPatients = filteredPatients.filter(p => mainPatientIds.has(p.patientId));
  console.log('PatientList: filteredPatients after mainPatientIds filter (disabled):', filteredPatients.map(p => p.patientId));

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
      await refreshPatients();
      await refreshAppointments();
      console.log('PatientList: Patient deleted and lists refreshed successfully');
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

  const handleFileClick = (patient: Patient) => {
    const navId = patient.id || patient.patientId;
    console.log('🔥 PatientList: File button clicked for patient:', navId, patient.name);
    console.log('🔥 PatientList: Navigating to:', `/patients/${navId}/file`);
  };

  if (loading) {
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2" />
            Add Patient
          </Button>
        </div>
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
          {filteredPatients.map((patient, idx) => (
            <TableRow key={patient.id || patient.patientId || idx}>
              <TableCell className="font-medium">
                {`SD-P${String(idx + 1).padStart(5, '0')}`}
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
              <TableCell>{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}</TableCell>
              <TableCell>
                {patient.nextAppointment 
                  ? new Date(patient.nextAppointment).toLocaleDateString() 
                  : 'Not scheduled'}
              </TableCell>
              <TableCell className="text-right">
                <Link 
                  to={`/patients/${patient.id || patient.patientId}/file`}
                  onClick={() => handleFileClick(patient)}
                >
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    File
                  </Button>
                </Link>
                {userProfile?.role === 'admin' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditPatient(patient)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
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
                          onClick={() => handleDeletePatient(patient.id || patient.patientId, patient.name)}
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
      
      {filteredPatients.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No patients found matching your search criteria.' : 'No patients found. Add your first patient!'}
        </div>
      )}

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPatient={handleAddPatient}
      />

      {userProfile?.role === 'admin' && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPatient(null);
          }}
          onUpdatePatient={handleUpdatePatient}
          patient={selectedPatient}
        />
      )}
    </div>
  );
};

export default PatientList;
