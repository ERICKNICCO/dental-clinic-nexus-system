
import { useState, useEffect } from 'react';
import { supabaseNotificationService } from '../services/supabaseNotificationService';
import { useAuth } from '../contexts/AuthContext';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  appointment_id?: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'admin') {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        console.log('🔥 Loading admin notifications...');
        const adminNotifications = await supabaseNotificationService.getNotifications('admin');
        console.log('🔥 Admin notifications loaded:', adminNotifications);
        
        // Transform to admin notification format
        const transformedNotifications = adminNotifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          created_at: n.timestamp.toISOString(),
          appointment_id: n.appointmentId
        }));
        
        setNotifications(transformedNotifications);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading admin notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new notifications for admin
    const unsubscribe = supabaseNotificationService.subscribeToNotifications('admin', (newNotification) => {
      console.log('🔥 New admin notification received:', newNotification);
      
      // Transform and add to notifications
      const transformedNotification = {
        id: newNotification.id,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        read: newNotification.read,
        created_at: newNotification.timestamp.toISOString(),
        appointment_id: newNotification.appointmentId
      };
      
      setNotifications(prev => [transformedNotification, ...prev]);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
        unsubscribe.unsubscribe();
      }
    };
  }, [userProfile]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabaseNotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead
  };
};
