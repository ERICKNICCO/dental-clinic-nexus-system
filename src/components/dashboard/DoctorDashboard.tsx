import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, User, Clock, CheckCircle, Stethoscope } from 'lucide-react';
import { useDoctorAppointments } from '../../hooks/useDoctorAppointments';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabasePatients } from '../../hooks/useSupabasePatients';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const { userProfile } = useAuth();
  const { patients } = useSupabasePatients();
  const { todaysAppointments, checkedInAppointments, loading, error, checkInPatient } = useDoctorAppointments(userProfile?.name || '');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter appointments that are approved but not yet checked in
  const approvedAppointments = todaysAppointments.filter(
    appointment => appointment.status === 'Approved'
  );

  // Add this after checkedInAppointments and approvedAppointments
  const confirmedAppointments = todaysAppointments.filter(
    appointment => appointment.status === 'Confirmed'
  );

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingIn(appointmentId);
    try {
      await checkInPatient(appointmentId);
      toast.success('Patient checked in successfully');
    } catch (error) {
      toast.error('Failed to check in patient');
    } finally {
      setCheckingIn(null);
    }
  };

  // Enhanced patient matching function
  const findPatientByAppointment = (appointment: any) => {
    const appointmentPatientName = (appointment.patient?.name || appointment.patient_name || '').trim();
    const appointmentPatientPhone = appointment.patient?.phone || appointment.patient_phone || '';
    const appointmentPatientEmail = appointment.patient?.email || appointment.patient_email || '';
    
    console.log('🔍 Finding patient for appointment:', {
      appointmentId: appointment.id,
      name: appointmentPatientName,
      phone: appointmentPatientPhone,
      email: appointmentPatientEmail
    });

    // Strategy 1: Exact name match (case insensitive)
    let patient = patients.find(p => 
      p.name.trim().toLowerCase() === appointmentPatientName.toLowerCase()
    );

    // Strategy 2: Partial name match (contains or starts with)
    if (!patient && appointmentPatientName) {
      patient = patients.find(p => {
        const patientNameLower = p.name.trim().toLowerCase();
        const appointmentNameLower = appointmentPatientName.toLowerCase();
        
        return patientNameLower.includes(appointmentNameLower) || 
               appointmentNameLower.includes(patientNameLower) ||
               patientNameLower.startsWith(appointmentNameLower) ||
               appointmentNameLower.startsWith(patientNameLower);
      });
    }

    // Strategy 3: Phone number match
    if (!patient && appointmentPatientPhone) {
      patient = patients.find(p => 
        p.phone && p.phone.replace(/\s/g, '') === appointmentPatientPhone.replace(/\s/g, '')
      );
    }

    // Strategy 4: Email match
    if (!patient && appointmentPatientEmail) {
      patient = patients.find(p => 
        p.email && p.email.toLowerCase() === appointmentPatientEmail.toLowerCase()
      );
    }

    // Strategy 5: Fuzzy matching by splitting names
    if (!patient && appointmentPatientName) {
      const appointmentWords = appointmentPatientName.toLowerCase().split(' ').filter(w => w.length > 1);
      patient = patients.find(p => {
        const patientWords = p.name.toLowerCase().split(' ').filter(w => w.length > 1);
        return appointmentWords.some(aWord => 
          patientWords.some(pWord => pWord.includes(aWord) || aWord.includes(pWord))
        );
      });
    }

    console.log('🔍 Patient search result:', {
      found: !!patient,
      patientId: patient?.id,
      patientName: patient?.name,
      strategies: 'Used enhanced matching'
    });

    return patient;
  };

  const handleStartTreatment = (appointment: any) => {
    console.log('🔥 DoctorDashboard: Starting treatment for appointment:', appointment);
    
    const patient = findPatientByAppointment(appointment);
    
    if (patient && patient.id) {
      console.log('✅ DoctorDashboard: Navigating to patient file:', patient.id);
      navigate(`/patients/${patient.id}`);
    } else {
      console.error('❌ DoctorDashboard: Patient not found');
      console.error('❌ Available patients:', patients.map(p => ({ id: p.id, name: p.name, phone: p.phone })));
      
      // Show detailed error with suggestions
      const appointmentPatientName = appointment.patient?.name || appointment.patient_name || 'Unknown';
      toast.error(
        `Patient "${appointmentPatientName}" not found. This could be because:
        1. Patient was not properly registered when appointment was accepted
        2. Patient name in appointment doesn't match patient record
        3. Patient may need to be manually added to the system
        
        Please check the Patients section or re-register this patient.`,
        { duration: 8000 }
      );
      
      // Navigate to patients list to help user find or add the patient
      navigate('/patients');
    }
  };

  const handleContinueConsultation = (appointment) => {
    const patient = findPatientByAppointment(appointment);
    
    if (patient) {
      navigate(`/patients/${patient.id}`);
    } else {
      const appointmentPatientName = appointment.patient?.name || appointment.patient_name || 'Unknown';
      toast.error(
        `Patient "${appointmentPatientName}" not found in the system. Please check if the patient exists in the Patients section.`
      );
      navigate('/patients');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-6">
        <p>Error loading appointments: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-700">
          <p><strong>Doctor Name:</strong> {userProfile?.name}</p>
          <p><strong>Today's Date:</strong> {new Date().toISOString().split('T')[0]}</p>
          <p><strong>Total Today's Appointments:</strong> {todaysAppointments.length}</p>
          <p><strong>Approved Appointments:</strong> {approvedAppointments.length}</p>
          <p><strong>Checked In Appointments:</strong> {checkedInAppointments.length}</p>
          <p><strong>Total Patients in System:</strong> {patients.length}</p>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold">Patient Names in System</summary>
            <ul className="mt-1 ml-4">
              {patients.slice(0, 10).map(p => (
                <li key={p.id} className="text-xs">
                  {p.name} (ID: {p.id}) - Phone: {p.phone}
                </li>
              ))}
              {patients.length > 10 && <li className="text-xs">...and {patients.length - 10} more</li>}
            </ul>
          </details>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved & Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{approvedAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Ready for check-in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkedInAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Ready for treatment</p>
          </CardContent>
        </Card>
      </div>

      {/* Approved Appointments - Ready for Check-in */}
      {approvedAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Approved Appointments - Ready for Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvedAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{appointment.patient?.name || appointment.patient_name}</h3>
                      <p className="text-sm text-gray-600">{appointment.time} - {appointment.treatment}</p>
                      <p className="text-xs text-gray-500">{appointment.patient?.phone || appointment.patient_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Approved
                    </Badge>
                    <Button 
                      onClick={() => handleCheckIn(appointment.id)}
                      disabled={checkingIn === appointment.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {checkingIn === appointment.id ? 'Checking In...' : 'Check In Patient'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checked In Patients - Ready for Treatment */}
      {checkedInAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Patients Ready for Treatment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkedInAppointments.map((appointment) => {
                const matchedPatient = findPatientByAppointment(appointment);
                
                return (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.patient?.name || appointment.patient_name}</h3>
                        <p className="text-sm text-gray-600">{appointment.time} - {appointment.treatment}</p>
                        <p className="text-xs text-gray-500">{appointment.patient?.phone || appointment.patient_phone}</p>
                        <p className="text-xs text-blue-600">
                          Patient Status: {matchedPatient ? `Found (ID: ${matchedPatient.id})` : 'Not found in system'}
                        </p>
                        {matchedPatient && (
                          <p className="text-xs text-green-600">
                            Matched to: {matchedPatient.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Checked In
                      </Badge>
                      <Button 
                        onClick={() => handleStartTreatment(appointment)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Treatment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Appointments - Waiting for Admin Approval */}
      {confirmedAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Confirmed Appointments - Waiting for Admin Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg opacity-70 cursor-not-allowed">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{appointment.patient?.name || appointment.patient_name}</h3>
                      <p className="text-sm text-gray-600">{appointment.time} - {appointment.treatment}</p>
                      <p className="text-xs text-gray-500">{appointment.patient?.phone || appointment.patient_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Confirmed
                    </Badge>
                    <Button disabled className="bg-gray-300 cursor-not-allowed">
                      Waiting for admin approval
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No appointments message */}
      {todaysAppointments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No appointments today</h3>
            <p className="text-gray-500">You have no scheduled appointments for today.</p>
            <div className="mt-4 text-sm text-gray-400">
              <p>Looking for appointments assigned to: <strong>{userProfile?.name}</strong></p>
              <p>Date: <strong>{new Date().toISOString().split('T')[0]}</strong></p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorDashboard;
