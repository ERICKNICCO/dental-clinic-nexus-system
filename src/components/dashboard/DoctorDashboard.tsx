
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, User, Clock, CheckCircle, Stethoscope } from 'lucide-react';
import { useDoctorAppointments } from '../../hooks/useDoctorAppointments';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const DoctorDashboard = () => {
  const { userProfile } = useAuth();
  const { todaysAppointments, checkedInAppointments, loading, error, checkInPatient } = useDoctorAppointments(userProfile?.name || '');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Filter appointments that are approved but not yet checked in
  const approvedAppointments = todaysAppointments.filter(
    appointment => appointment.status === 'Approved'
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
              {checkedInAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{appointment.patient?.name || appointment.patient_name}</h3>
                      <p className="text-sm text-gray-600">{appointment.time} - {appointment.treatment}</p>
                      <p className="text-xs text-gray-500">{appointment.patient?.phone || appointment.patient_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Checked In
                    </Badge>
                    <Button 
                      onClick={() => window.location.href = `/patient/${appointment.patientId || appointment.patient_id}`}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Treatment
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorDashboard;
