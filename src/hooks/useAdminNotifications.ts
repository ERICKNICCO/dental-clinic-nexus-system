
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
        const adminNotifications = await supabaseNotificationService.getNotificationsForAdmin();
        console.log('🔥 Admin notifications loaded:', adminNotifications);
        setNotifications(adminNotifications);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading admin notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new notifications
    const channel = supabaseNotificationService.subscribeToNotifications((newNotifications) => {
      console.log('🔥 New notifications received:', newNotifications);
      // Filter for admin notifications
      const adminNotifications = newNotifications.filter(n => 
        n.target_doctor_name === 'admin' || 
        n.type === 'consultation_completed' || 
        n.type === 'payment_required'
      );
      setNotifications(adminNotifications);
    });

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
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
