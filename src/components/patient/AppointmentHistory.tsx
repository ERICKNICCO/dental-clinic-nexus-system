import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, Clock, User, FileText, Eye, Plus } from 'lucide-react';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';

interface AppointmentHistoryItem {
  id: string;
  date: string;
  time: string;
  dentist: string;
  treatment: string;
  status: string;
  notes: string | null;
  patient_name: string;
}

interface AppointmentHistoryProps {
  patientId: string;
}

const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({ patientId }) => {
  const [appointments, setAppointments] = useState<AppointmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        console.log('Fetching appointments for patient ID:', patientId);
        setLoading(true);
        const data = await supabaseAppointmentService.getAppointmentsByPatientId(patientId);
        console.log('Fetched appointments:', data);
        
        // Transform the data to match our interface
        const transformedData: AppointmentHistoryItem[] = data.map(appointment => ({
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          dentist: appointment.dentist,
          treatment: appointment.treatment,
          status: appointment.status,
          notes: appointment.notes,
          patient_name: appointment.patientId || appointment.patient?.name || 'Unknown Patient'
        }));
        
        setAppointments(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointment history');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchAppointments();
    }
  }, [patientId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
          <p className="text-gray-600">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
              <p className="text-gray-600">This patient has no appointment history.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg text-gray-900">
                        {new Date(appointment.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Dr. {appointment.dentist}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{appointment.treatment}</span>
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory;
