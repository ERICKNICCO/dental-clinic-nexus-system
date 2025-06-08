
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'new_appointment' | 'appointment_approved' | 'appointment_cancelled';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  appointmentId?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile } = useAuth();

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiRza3MfCwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeA=');
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Could not create notification sound:', error);
    }
  };

  useEffect(() => {
    if (!userProfile) return;

    let lastAppointmentCount = 0;
    let knownAppointmentIds = new Set<string>();

    const unsubscribe = appointmentService.subscribeToAppointments((appointments) => {
      // For admin: notify on new appointments
      if (userProfile.role === 'admin') {
        const newAppointments = appointments.filter(apt => !knownAppointmentIds.has(apt.id));
        
        if (newAppointments.length > 0 && knownAppointmentIds.size > 0) {
          newAppointments.forEach(appointment => {
            const notification: Notification = {
              id: `new_${appointment.id}_${Date.now()}`,
              type: 'new_appointment',
              title: 'New Appointment',
              message: `New appointment from ${appointment.patient.name} for ${appointment.treatment}`,
              timestamp: new Date(),
              read: false,
              appointmentId: appointment.id
            };
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
            playNotificationSound();
          });
        }
        
        // Update known appointment IDs
        appointments.forEach(apt => knownAppointmentIds.add(apt.id));
      }
      
      // For doctors: notify when their appointments are approved
      if (userProfile.role === 'doctor') {
        const doctorAppointments = appointments.filter(apt => 
          apt.dentist === userProfile.name && apt.status === 'Approved'
        );
        
        // Check for newly approved appointments
        doctorAppointments.forEach(appointment => {
          const notificationId = `approved_${appointment.id}`;
          const existingNotification = notifications.find(n => n.id === notificationId);
          
          if (!existingNotification && knownAppointmentIds.size > 0) {
            const notification: Notification = {
              id: notificationId,
              type: 'appointment_approved',
              title: 'Appointment Approved',
              message: `Your appointment with ${appointment.patient.name} has been approved`,
              timestamp: new Date(),
              read: false,
              appointmentId: appointment.id
            };
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            playNotificationSound();
          }
        });
        
        // Update known appointment IDs
        appointments.forEach(apt => knownAppointmentIds.add(apt.id));
      }
    });

    return () => unsubscribe();
  }, [userProfile, notifications]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};
