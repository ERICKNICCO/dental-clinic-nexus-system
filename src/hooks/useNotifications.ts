
import { useState, useEffect } from 'react';
import { supabaseNotificationService } from '../services/supabaseNotificationService';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.name) return;

    console.log('Loading notifications for:', userProfile.name, 'Role:', userProfile.role);
    
    // Load initial unread notifications
    const loadNotifications = async () => {
      try {
        const unreadNotifications = await supabaseNotificationService.getUnreadNotifications(userProfile.name);
        console.log('Loaded unread notifications:', unreadNotifications);
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new notifications
    console.log('Setting up notifications subscription for:', userProfile.name);
    const { unsubscribe } = supabaseNotificationService.subscribeToNotifications(
      userProfile.name,
      (newNotification) => {
        console.log('Received new notification:', newNotification);
        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some(n => n.id === newNotification.id);
          if (exists) {
            return prev;
          }
          return [newNotification, ...prev];
        });
      }
    );

    return () => {
      console.log('Cleaning up notifications subscription');
      unsubscribe();
    };
  }, [userProfile?.name, userProfile?.role]);

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
