
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { useSupabaseAppointments } from '../../../hooks/useSupabaseAppointments';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface AppointmentSchedulerProps {
  patientName: string;
  patientId: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  patientName,
  patientId
}) => {
  const { userProfile } = useAuth();
  const { addAppointment } = useSupabaseAppointments();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    treatment: '',
    dentist: userProfile?.name || '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Treatment options for follow-up appointments
  const followUpTreatments = [
    'Follow-up Check',
    'Post-treatment Review',
    'Healing Assessment',
    'Progress Evaluation',
    'Routine Check-up',
    'Treatment Monitoring',
    'Other Follow-up'
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.treatment || !formData.dentist) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentData = {
        patient: {
          name: patientName,
          email: '',
          phone: '',
          image: ''
        },
        patient_name: patientName,
        patient_email: '',
        patient_phone: '',
        treatment: formData.treatment,
        dentist: formData.dentist,
        status: 'Confirmed' as const, // Follow-up appointments are auto-confirmed
        date: formData.date,
        time: formData.time,
        notes: `Follow-up appointment - ${formData.notes}`.trim(),
        patient_id: patientId
      };

      console.log('Creating follow-up appointment:', appointmentData);
      await addAppointment(appointmentData);
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        treatment: '',
        dentist: userProfile?.name || '',
        notes: ''
      });
      
      toast.success('Follow-up appointment scheduled successfully (No charge)');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Follow-up Appointment
        </CardTitle>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Follow-up appointments are not charged</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            This appointment will be marked as a follow-up visit with no payment required.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="time">Time *</Label>
              <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formData.time || "Select time"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="treatment">Follow-up Type *</Label>
            <Select value={formData.treatment} onValueChange={(value) => handleInputChange('treatment', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select follow-up type" />
              </SelectTrigger>
              <SelectContent>
                {followUpTreatments.map((treatment) => (
                  <SelectItem key={treatment} value={treatment}>
                    {treatment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dentist">Doctor *</Label>
            <Select value={formData.dentist} onValueChange={(value) => handleInputChange('dentist', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {formData.dentist || "Select doctor"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dr. Rashid Qurban">Dr. Rashid Qurban</SelectItem>
                <SelectItem value="Dr. Sarah Ahmed">Dr. Sarah Ahmed</SelectItem>
                <SelectItem value="Dr. Michael Johnson">Dr. Michael Johnson</SelectItem>
                <SelectItem value="Dr. Emily Chen">Dr. Emily Chen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any specific instructions or notes for the follow-up appointment..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Follow-up Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppointmentScheduler;
