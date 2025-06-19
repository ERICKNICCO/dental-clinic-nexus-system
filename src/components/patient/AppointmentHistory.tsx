
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus, Save, X, Edit, Trash2 } from 'lucide-react';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';
import { Appointment } from '../../types/appointment';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentHistoryProps {
  patientId: string;
  isEditing?: boolean;
}

const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({ patientId, isEditing = false }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const [newAppointment, setNewAppointment] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    treatment: '',
    status: 'Pending' as Appointment['status']
  });

  const [editAppointment, setEditAppointment] = useState({
    date: '',
    time: '',
    treatment: '',
    status: 'Pending' as Appointment['status']
  });

  useEffect(() => {
    console.log('Setting up appointments subscription for patient:', patientId);
    setLoading(true);
    
    const unsubscribe = supabaseAppointmentService.subscribeToAppointments((allAppointments) => {
      // Filter appointments for this specific patient
      const patientAppointments = allAppointments.filter(
        appointment => appointment.patient_name && 
        appointment.patient_name.toLowerCase().includes(patientId.toLowerCase())
      );
      
      console.log('Patient appointments:', patientAppointments);
      setAppointments(patientAppointments);
      setLoading(false);
      setError(null);
    });

    return () => {
      console.log('Cleaning up appointments subscription');
      unsubscribe();
    };
  }, [patientId]);

  const handleSaveAppointment = async () => {
    try {
      await supabaseAppointmentService.addAppointment({
        ...newAppointment,
        dentist: userProfile?.name || 'Unknown Doctor',
        patient_name: 'Patient Name', // This should be dynamically set
        patient_phone: '',
        patient_email: '',
        treatment: newAppointment.treatment,
        // Legacy patient object for backward compatibility
        patient: {
          name: 'Patient Name',
          phone: '',
          email: '',
          image: ''
        }
      });
      setIsAddingNew(false);
      setNewAppointment({
        date: new Date().toISOString().split('T')[0],
        time: '',
        treatment: '',
        status: 'Pending'
      });
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setEditAppointment({
      date: appointment.date,
      time: appointment.time,
      treatment: appointment.treatment,
      status: appointment.status
    });
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointmentId) return;
    
    try {
      await supabaseAppointmentService.updateAppointment(editingAppointmentId, editAppointment);
      setEditingAppointmentId(null);
      setEditAppointment({
        date: '',
        time: '',
        treatment: '',
        status: 'Pending'
      });
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await supabaseAppointmentService.deleteAppointment(appointmentId);
      } catch (error) {
        console.error('Failed to delete appointment:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Checked In':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading appointment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading appointment history: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Appointment Button */}
      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
        </div>
      )}

      {/* New Appointment Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>New Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-date">Date</Label>
                <Input 
                  id="new-date" 
                  type="date" 
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="new-time">Time</Label>
                <Input 
                  id="new-time" 
                  type="time" 
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="new-treatment">Treatment</Label>
              <Input 
                id="new-treatment" 
                placeholder="Enter treatment"
                value={newAppointment.treatment}
                onChange={(e) => setNewAppointment({...newAppointment, treatment: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="new-status">Status</Label>
              <Select onValueChange={(value) => setNewAppointment({...newAppointment, status: value as Appointment['status']})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveAppointment}>
                <Save className="w-4 h-4 mr-2" />
                Save Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No appointments found for this patient.
          </div>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingAppointmentId === appointment.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editAppointment.treatment}
                          onChange={(e) => setEditAppointment({...editAppointment, treatment: e.target.value})}
                          placeholder="Treatment"
                        />
                        <div className="flex space-x-2">
                          <Input
                            type="date"
                            value={editAppointment.date}
                            onChange={(e) => setEditAppointment({...editAppointment, date: e.target.value})}
                          />
                          <Input
                            type="time"
                            value={editAppointment.time}
                            onChange={(e) => setEditAppointment({...editAppointment, time: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-lg">{appointment.treatment}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingAppointmentId === appointment.id ? (
                      <Select 
                        value={editAppointment.status} 
                        onValueChange={(value) => setEditAppointment({...editAppointment, status: value as Appointment['status']})}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    )}
                    {isEditing && (
                      <div className="flex space-x-1">
                        {editingAppointmentId === appointment.id ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={handleUpdateAppointment}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingAppointmentId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEditAppointment(appointment)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAppointment(appointment.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium text-sm">Doctor:</span>
                    <span className="text-sm text-gray-600 ml-2">{appointment.dentist}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-sm">Patient:</span>
                    <span className="text-sm text-gray-600 ml-2">{appointment.patient_name || appointment.patient?.name}</span>
                  </div>
                  {(appointment.patient_phone || appointment.patient?.phone) && (
                    <div className="flex items-center">
                      <span className="font-medium text-sm">Phone:</span>
                      <span className="text-sm text-gray-600 ml-2">{appointment.patient_phone || appointment.patient?.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;
