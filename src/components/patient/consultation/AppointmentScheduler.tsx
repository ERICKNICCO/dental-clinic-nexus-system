
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Calendar, Clock, Plus, CheckCircle } from 'lucide-react';
import { supabaseAppointmentService } from '../../../services/supabaseAppointmentService';
import { treatmentPricingService } from '../../../services/treatmentPricingService';
import { useAuth } from '../../../contexts/AuthContext';

interface AppointmentSchedulerProps {
  patientName: string;
  patientId: string;
  onAppointmentScheduled?: () => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  patientName,
  patientId,
  onAppointmentScheduled
}) => {
  const { userProfile } = useAuth();
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    treatment: ''
  });
  const [loading, setLoading] = useState(false);

  const treatments = treatmentPricingService.getAllTreatments();
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleScheduleAppointment = async () => {
    if (!appointmentData.date || !appointmentData.time || !appointmentData.treatment) {
      return;
    }

    try {
      setLoading(true);
      
      const appointmentToCreate = {
        date: appointmentData.date,
        time: appointmentData.time,
        patient: {
          name: patientName,
          phone: 'From consultation',
          email: '',
          image: '',
          initials: patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        },
        treatment: appointmentData.treatment,
        dentist: userProfile?.name || 'Unknown Doctor',
        status: 'Pending' as const,
        patientId: patientId
      };

      await supabaseAppointmentService.addAppointment(appointmentToCreate);
      
      setIsScheduled(true);
      setIsScheduling(false);
      
      if (onAppointmentScheduled) {
        onAppointmentScheduled();
      }
      
      console.log('Next appointment scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isScheduled) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Next appointment scheduled successfully!</span>
        </div>
        <div className="mt-2 text-sm text-green-600">
          <p><strong>Date:</strong> {new Date(appointmentData.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {appointmentData.time}</p>
          <p><strong>Treatment:</strong> {appointmentData.treatment}</p>
        </div>
      </div>
    );
  }

  if (!isScheduling) {
    return (
      <Button 
        onClick={() => setIsScheduling(true)}
        variant="outline"
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Schedule Next Appointment
      </Button>
    );
  }

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-blue-700 font-medium">
        <Calendar className="w-5 h-5" />
        Schedule Next Appointment
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appointment-date">Date</Label>
          <Input
            id="appointment-date"
            type="date"
            value={appointmentData.date}
            onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <Label htmlFor="appointment-time">Time</Label>
          <Select onValueChange={(value) => setAppointmentData({...appointmentData, time: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {time}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="appointment-treatment">Treatment</Label>
        <Select onValueChange={(value) => setAppointmentData({...appointmentData, treatment: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select treatment" />
          </SelectTrigger>
          <SelectContent>
            {treatments.map((treatment) => (
              <SelectItem key={treatment.id} value={treatment.name}>
                <div className="flex flex-col">
                  <span>{treatment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {treatmentPricingService.formatPrice(treatment.basePrice)} - {treatment.duration}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleScheduleAppointment}
          disabled={!appointmentData.date || !appointmentData.time || !appointmentData.treatment || loading}
          className="flex-1"
        >
          {loading ? 'Scheduling...' : 'Schedule Appointment'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setIsScheduling(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
