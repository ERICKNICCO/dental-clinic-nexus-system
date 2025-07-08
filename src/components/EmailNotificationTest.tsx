
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { emailNotificationService } from '../services/emailNotificationService';
import { toast } from 'sonner';

const EmailNotificationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setLoading(true);
    try {
      await emailNotificationService.sendAppointmentConfirmation({
        to: testEmail,
        subject: 'Test Email',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        patientName: 'Test Patient',
        dentistName: 'Test Doctor',
        treatment: 'Test Treatment',
        appointmentId: 'test-123'
      });
      
      toast.success('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error sending test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Notification Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="testEmail">Test Email Address</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to test"
          />
        </div>

        <Button 
          onClick={sendTestEmail} 
          disabled={loading || !testEmail}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationTest;
