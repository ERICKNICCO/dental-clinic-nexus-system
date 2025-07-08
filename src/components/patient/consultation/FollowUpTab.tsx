
import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { useToast } from '../../ui/use-toast';
import { Printer, Mail, Download, Lock } from 'lucide-react';
import AppointmentScheduler from './AppointmentScheduler';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent } from '../../ui/card';

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
  const isAdmin = userProfile?.role === 'admin';

  if (isAdmin) {
    return (
      <div className="space-y-6 mt-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Admin Access Restricted</span>
            </div>
            <p className="text-sm text-yellow-700">
              Follow-up instructions and appointment scheduling are only accessible to doctors.
            </p>
          </CardContent>
        </Card>

        {followUpInstructions && (
          <div>
            <Label htmlFor="followUpInstructions">Follow-up Instructions (Read Only)</Label>
            <Textarea
              id="followUpInstructions"
              value={followUpInstructions}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
              rows={4}
            />
          </div>
        )}
      </div>
    );
  }

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

      <div className="border-t pt-6">
        <Label className="text-base font-semibold">Schedule Next Appointment</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Create an actual appointment that will appear in the appointment system (Follow-up appointments are not charged)
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
