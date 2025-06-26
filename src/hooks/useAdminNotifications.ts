
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  appointment_id?: string;
  read: boolean;
  created_at: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('target_doctor_name', 'admin')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setNotifications(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        setLoading(false);
      }
    };

    // Set up real-time subscription
    const setupSubscription = () => {
      channel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: 'target_doctor_name=eq.admin'
          },
          (payload) => {
            console.log('Notification change received:', payload);
            fetchNotifications(); // Refresh notifications
          }
        )
        .subscribe();
    };

    fetchNotifications().then(() => {
      setupSubscription();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    unreadCount: notifications.filter(n => !n.read).length
  };
};
