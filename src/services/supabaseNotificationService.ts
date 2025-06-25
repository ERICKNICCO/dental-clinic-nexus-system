import { supabase } from '../integrations/supabase/client';
import { Notification, SupabaseNotification } from '../types/notification';

export const supabaseNotificationService = {
  // Transform SupabaseNotification to app Notification
  transformToNotification(data: SupabaseNotification): Notification {
    return {
      id: data.id,
      type: data.type as Notification['type'],
      title: data.title,
      message: data.message,
      timestamp: new Date(data.timestamp),
      read: data.read,
      appointmentId: data.appointment_id,
      targetDoctorName: data.target_doctor_name,
    };
  },

  // Create a new notification
  async createNotification(notification: Omit<SupabaseNotification, 'id' | 'timestamp' | 'read'>) {
    console.log('Creating notification:', notification);
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        timestamp: new Date().toISOString(),
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log('Created notification:', data);
    return this.transformToNotification(data);
  },

  // Get all unread notifications for a doctor or admin
  async getUnreadNotifications(doctorName: string): Promise<Notification[]> {
    console.log('Getting unread notifications for doctor:', doctorName);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_doctor_name.eq.${doctorName},target_doctor_name.is.null`)
      .eq('read', false)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }

    console.log('Found unread notifications:', data);
    return (data as SupabaseNotification[]).map(this.transformToNotification);
  },

  // Mark a notification as read
  async markAsRead(notificationId: string) {
    console.log('Marking notification as read:', notificationId);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
    console.log('Marked notification as read:', notificationId);
  },

  // Subscribe to notifications for a specific doctor or admin
  subscribeToNotifications(doctorName: string, callback: (notification: Notification) => void) {
    console.log('Setting up notification subscription for doctor:', doctorName);
    const channelName = `notifications_${doctorName}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Received notification payload:', payload);
          const newNotification = payload.new as SupabaseNotification;
          
          // Check if this notification is for this user (specific doctor or admin/global notification)
          if (newNotification.target_doctor_name === doctorName || newNotification.target_doctor_name === null) {
            const notification = this.transformToNotification(newNotification);
            console.log('Transformed notification for user:', notification);
            callback(notification);
          }
        }
      )
      .subscribe();

    console.log('Subscribed to notifications channel:', channelName);
    return {
      unsubscribe: () => {
        console.log('Unsubscribing from notifications channel:', channelName);
        supabase.removeChannel(channel);
      }
    };
  },

  // Add a notification
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const { type, title, message, appointmentId, targetDoctorName } = notification;
    const { error } = await supabase.from('notifications').insert({
      type,
      title,
      message,
      read: false,
      appointment_id: appointmentId || null,
      target_doctor_name: targetDoctorName || null,
      timestamp: new Date().toISOString(),
    });
    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) throw error;
  },

  // Mark all as unread
  async markAllAsUnread(ids: string[]) {
    if (!ids.length) return;
    const { error } = await supabase.from('notifications').update({ read: false }).in('id', ids);
    if (error) throw error;
  },

  // Get notifications (optionally for a doctor)
  async getNotifications(targetDoctorName?: string): Promise<Notification[]> {
    console.log('Getting notifications for doctor:', targetDoctorName);
    let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (targetDoctorName) {
      query = query.eq('target_doctor_name', targetDoctorName);
    }
    const { data, error } = await query;
    if (error) throw error;
    console.log('Found notifications:', data);
    return (data as SupabaseNotification[]).map(this.transformToNotification);
  },

  // Subscribe to all notifications with optional doctor filter
  subscribeToAllNotifications(callback: (notifications: Notification[]) => void, targetDoctorName?: string) {
    const channelName = targetDoctorName 
      ? `notifications_all_${targetDoctorName}`
      : `notifications_all`;
    
    console.log('Setting up all notifications subscription:', channelName);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async () => {
          console.log('Received notifications update');
          const notifications = await this.getNotifications(targetDoctorName);
          console.log('Fetched updated notifications:', notifications);
          callback(notifications);
        }
      )
      .subscribe();

    // Initial fetch
    this.getNotifications(targetDoctorName).then(callback);

    return () => {
      console.log('Unsubscribing from all notifications channel:', channelName);
      supabase.removeChannel(channel);
    };
  },
};
