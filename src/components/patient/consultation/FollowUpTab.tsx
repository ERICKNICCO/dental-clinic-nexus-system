
import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { useToast } from '../../ui/use-toast';
import { Printer, Mail, Download } from 'lucide-react';
import AppointmentScheduler from './AppointmentScheduler';
import { useAuth } from '../../../contexts/AuthContext';

interface FollowUpTabProps {
  followUpInstructions: string;
  nextAppointment: string;
  onUpdateField: (field: string, value: string) => void;
  patientName?: string;
  patientId?: string;
}

const FollowUpTab: React.FC<FollowUpTabProps> = ({
  followUpInstructions,
  nextAppointment,
  onUpdateField,
  patientName = '',
  patientId = ''
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  return (
    <div className="space-y-6 mt-6">
      <div>
        <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
        <Textarea
          id="followUpInstructions"
          placeholder="Instructions for patient care and follow-up..."
          value={followUpInstructions}
          onChange={(e) => onUpdateField('followUpInstructions', e.target.value)}
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="nextAppointment">Next Appointment Date (for reference)</Label>
        <Input
          id="nextAppointment"
          type="date"
          value={nextAppointment}
          onChange={(e) => onUpdateField('nextAppointment', e.target.value)}
        />
      </div>

      <div className="border-t pt-6">
        <Label className="text-base font-semibold">Schedule Next Appointment</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Create an actual appointment that will appear in the appointment system
        </p>
        <AppointmentScheduler 
          patientName={patientName}
          patientId={patientId}
        />
      </div>
    </div>
  );
};

export default FollowUpTab;
