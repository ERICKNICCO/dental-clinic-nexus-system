import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, TestTube, User, Shield, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseNotificationService } from '../services/supabaseNotificationService';
import { toast } from 'sonner';

const NotificationTest: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const testNotificationTypes = [
    {
      type: 'new_appointment',
      title: 'New Appointment Test',
      message: 'This is a test notification for a new appointment',
      target_role: 'admin'
    },
    {
      type: 'consultation_completed',
      title: 'Consultation Completed Test',
      message: 'This is a test notification for a completed consultation',
      target_role: 'admin'
    },
    {
      type: 'payment_required',
      title: 'Payment Required Test',
      message: 'This is a test notification for payment required',
      target_role: 'admin'
    },
    {
      type: 'appointment_approved',
      title: 'Appointment Approved Test',
      message: 'This is a test notification for an approved appointment',
      target_role: 'doctor'
    },
    {
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled Test',
      message: 'This is a test notification for a cancelled appointment',
      target_role: 'doctor'
    }
  ];

  const sendTestNotification = async (notification: any) => {
    setLoading(true);
    try {
      await supabaseNotificationService.createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        target_role: notification.target_role,
        target_user: userProfile?.name
      });
      
      toast.success(`Test notification sent to ${notification.target_role}!`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationToCurrentUser = async () => {
    setLoading(true);
    try {
      await supabaseNotificationService.createNotification({
        type: 'new_appointment',
        title: 'Personal Test Notification',
        message: `This is a test notification for ${userProfile?.name}`,
        target_user: userProfile?.name
      });
      
      toast.success('Personal test notification sent!');
    } catch (error) {
      console.error('Error sending personal test notification:', error);
      toast.error('Failed to send personal test notification');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'doctor':
        return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case 'radiologist':
        return <TestTube className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification System Test
          <Badge variant="outline" className="ml-2">
            {userProfile?.role || 'Unknown Role'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current User Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current User</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {userProfile?.name || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Role:</span> {userProfile?.role || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Test Notifications */}
        <div>
          <h3 className="font-semibold mb-4">Test Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testNotificationTypes.map((notification, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(notification.target_role)}
                  <span className="font-medium">{notification.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {notification.target_role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                <Button
                  size="sm"
                  onClick={() => sendTestNotification(notification)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Test */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Personal Test</h3>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Send a test notification specifically to your user account ({userProfile?.name})
            </p>
            <Button
              onClick={sendNotificationToCurrentUser}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Sending...' : 'Send Personal Test'}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">How to Test</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Click "Send Test" buttons to create test notifications</li>
            <li>Check the notification bell in the header for new notifications</li>
            <li>Click on notifications to mark them as read</li>
            <li>Verify that notifications appear for the correct roles</li>
            <li>Test real-time updates by sending notifications from different browser tabs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTest; 