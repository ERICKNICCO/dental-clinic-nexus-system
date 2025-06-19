
import { useState, useEffect } from 'react';
import { supabaseNotificationService } from '../services/supabaseNotificationService';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.name) {
      console.log('No user profile, skipping notifications setup');
      setLoading(false);
      return;
    }

    console.log('Loading notifications for:', userProfile.name);
    
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

    // Subscribe to new notifications with enhanced real-time updates
    console.log('Setting up notifications subscription for:', userProfile.name);
    const { unsubscribe } = supabaseNotificationService.subscribeToNotifications(
      userProfile.name,
      (newNotification) => {
        console.log('Received new notification:', newNotification);
        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some(n => n.id === newNotification.id);
          if (exists) {
            console.log('Notification already exists, skipping');
            return prev;
          }
          console.log('Adding new notification to list');
          return [newNotification, ...prev];
        });
      }
    );

    // Also subscribe to all notification changes for instant updates
    const { unsubscribe: unsubscribeAll } = supabaseNotificationService.subscribeToAllNotifications(
      (allNotifications) => {
        console.log('Received all notifications update:', allNotifications);
        // Filter for current user's notifications
        const userNotifications = allNotifications.filter(
          notification => 
            !notification.targetDoctorName || 
            notification.targetDoctorName === userProfile.name
        );
        setNotifications(userNotifications);
      },
      userProfile.name
    );

    return () => {
      console.log('Cleaning up notifications subscriptions');
      unsubscribe();
      unsubscribeAll();
    };
  }, [userProfile?.name]);

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await supabaseNotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      console.log('Notification marked as read successfully');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      await supabaseNotificationService.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      console.log('All notifications marked as read successfully');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  };
};
