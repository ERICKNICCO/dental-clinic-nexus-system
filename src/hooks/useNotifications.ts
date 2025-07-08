import { useState, useEffect } from 'react';
import { supabaseNotificationService } from '../services/supabaseNotificationService';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.role && !userProfile?.name) return;

    console.log('Loading notifications for:', userProfile.name, 'Role:', userProfile.role);
    
    // Load initial unread notifications for both role and user
    const loadNotifications = async () => {
      try {
        const roleNotifications = userProfile.role ? await supabaseNotificationService.getUnreadNotifications(userProfile.role) : [];
        const userNotifications = userProfile.name ? await supabaseNotificationService.getUnreadNotifications(userProfile.name) : [];
        // Merge and deduplicate
        const all = [...roleNotifications, ...userNotifications].filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i);
        setNotifications(all);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new notifications by role and user
    const unsubscribers = [];
    if (userProfile.role) {
      console.log('Setting up notifications subscription for role:', userProfile.role);
      unsubscribers.push(supabaseNotificationService.subscribeToNotifications(
        userProfile.role,
        (newNotification) => {
          setNotifications((prev) => {
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });
        }
      ));
    }
    if (userProfile.name) {
      console.log('Setting up notifications subscription for user:', userProfile.name);
      unsubscribers.push(supabaseNotificationService.subscribeToNotifications(
      userProfile.name,
      (newNotification) => {
        setNotifications((prev) => {
          const exists = prev.some(n => n.id === newNotification.id);
            if (exists) return prev;
          return [newNotification, ...prev];
        });
      }
      ));
    }

    return () => {
      console.log('Cleaning up notifications subscriptions');
      unsubscribers.forEach(u => u.unsubscribe && u.unsubscribe());
    };
  }, [userProfile?.role, userProfile?.name]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabaseNotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
  };
};
