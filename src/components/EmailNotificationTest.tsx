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
  const [emailType, setEmailType] = useState<'confirmation' | 'approval' | 'reminder' | 'cancellation'>('confirmation');
  const [serviceStatus, setServiceStatus] = useState<string>('Unknown');

  const checkServiceStatus = async () => {
    setLoading(true);
    try {
      const isAvailable = await emailNotificationService.checkEmailServiceStatus();
      setServiceStatus(isAvailable ? 'Available' : 'Not Available - Missing RESEND_API_KEY');
      toast.success(`Email service status: ${isAvailable ? 'Available' : 'Not Available'}`);
    } catch (error) {
      setServiceStatus('Error checking status');
      toast.error('Error checking email service status');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setLoading(true);
    try {
      const emailData = {
        appointmentId: 'test-appointment-123',
        recipientEmail: testEmail,
        patientName: 'Test Patient',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        treatment: 'Test Treatment',
        dentist: 'Test Doctor',
        emailType: emailType
      };

      const success = await emailNotificationService.sendAppointmentEmail(emailData);
      
      if (success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error('Failed to send test email. Check console for details.');
      }
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
          <Label htmlFor="serviceStatus">Service Status</Label>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm ${
              serviceStatus.includes('Available') ? 'bg-green-100 text-green-800' : 
              serviceStatus.includes('Error') ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {serviceStatus}
            </span>
            <Button 
              size="sm" 
              onClick={checkServiceStatus} 
              disabled={loading}
            >
              Check Status
            </Button>
          </div>
        </div>

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

        <div>
          <Label htmlFor="emailType">Email Type</Label>
          <Select value={emailType} onValueChange={(value: 'confirmation' | 'approval' | 'reminder' | 'cancellation') => setEmailType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmation">Confirmation</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="cancellation">Cancellation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={sendTestEmail} 
          disabled={loading || !testEmail}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>First check the service status</li>
            <li>If status shows "Missing RESEND_API_KEY", you need to set up the environment variable</li>
            <li>Enter a test email address</li>
            <li>Select email type and send test</li>
            <li>Check console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationTest; 