
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

    console.log('Setting up notifications for user:', userProfile.name);
    
    // Load initial unread notifications
    const loadNotifications = async () => {
      try {
        console.log('Loading initial notifications for:', userProfile.name);
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

    // Generate unique channel names with timestamp to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);

    // Subscribe to new notifications with unique channel name
    console.log('Setting up real-time notifications subscription for:', userProfile.name);
    const subscriptionResult = supabaseNotificationService.subscribeToNotifications(
      userProfile.name,
      (newNotification) => {
        console.log('Received new notification via subscription:', newNotification);
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

    // Subscribe to all notification changes for instant updates with unique channel name
    const unsubscribeAllNotifications = supabaseNotificationService.subscribeToAllNotifications(
      (allNotifications) => {
        console.log('Received all notifications update:', allNotifications);
        // Filter for current user's notifications
        const userNotifications = allNotifications.filter(
          notification => 
            !notification.targetDoctorName || 
            notification.targetDoctorName === userProfile.name
        );
        console.log('Filtered notifications for user:', userNotifications);
        setNotifications(userNotifications);
      },
      userProfile.name
    );

    return () => {
      console.log('Cleaning up notifications subscriptions for:', userProfile.name);
      subscriptionResult.unsubscribe();
      unsubscribeAllNotifications();
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
