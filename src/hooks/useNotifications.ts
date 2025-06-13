import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { Appointment } from '../types/appointment';
import { Notification } from '../types/notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile } = useAuth();

  const notificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
      );
      audio.play();
    } catch (err) {
      console.error('Notification sound failed to play:', err);
    }
  }, []);

  const addNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      try {
        await notificationService.addNotification(notification);
      } catch (error) {
        console.error('Error adding notification to Firestore:', error);
      }
    },
    []
  );

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notificationsRef.current.filter(n => !n.read);
      if (unread.length === 0) return;

      await notificationService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const markAllAsUnread = async () => {
    try {
      const readNotifications = notificationsRef.current.filter(n => n.read);
      if (readNotifications.length === 0) return;

      await notificationService.markAllAsUnread(readNotifications.map(n => n.id));
      setNotifications(prev => prev.map(n => ({ ...n, read: false })));
      setUnreadCount(readNotifications.length);
    } catch (error) {
      console.error('Failed to mark all notifications as unread:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  useEffect(() => {
    if (!userProfile) return;

    const unsubscribeAppointments = appointmentService.subscribeToAppointments(appointments => {
      const newAppointments = appointments.filter(
        app =>
          app.status === 'Pending' &&
          !notificationsRef.current.some(n => n.appointmentId === app.id)
      );

      newAppointments.forEach(app => {
        addNotification({
          type: 'new_appointment',
          title: 'New Appointment',
          message: `A new appointment has been requested by ${app.patient.name} for ${new Date(app.date).toLocaleDateString()}.`,
          appointmentId: app.id,
          targetDoctorName: app.dentist,
        });
      });
    });

    return () => unsubscribeAppointments();
  }, [userProfile, addNotification]);

  useEffect(() => {
    if (!userProfile) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      updatedNotifications => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      },
      userProfile.role === 'doctor' ? userProfile.name : undefined
    );

    return () => unsubscribe();
  }, [userProfile]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    markAllAsUnread,
    clearAllNotifications,
    playNotificationSound,
  };
};
