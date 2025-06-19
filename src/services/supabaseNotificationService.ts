
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
    console.log('Creating notification in database:', notification);
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
      console.error('Error creating notification in database:', error);
      throw error;
    }

    console.log('Successfully created notification in database:', data);
    return this.transformToNotification(data);
  },

  // Get all unread notifications for a doctor
  async getUnreadNotifications(doctorName: string): Promise<Notification[]> {
    console.log('Getting unread notifications for doctor:', doctorName);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_doctor_name', doctorName)
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

  // Subscribe to notifications for a specific doctor with unique channel names
  subscribeToNotifications(doctorName: string, callback: (notification: Notification) => void) {
    console.log('Setting up enhanced notification subscription for doctor:', doctorName);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const channelName = `notifications_enhanced_${doctorName}_${timestamp}_${randomId}`;
    
    let isSubscribed = true;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_doctor_name=eq.${doctorName}`,
        },
        (payload) => {
          if (!isSubscribed) return;
          
          console.log('Received enhanced notification payload for doctor:', doctorName, payload);
          const notification = this.transformToNotification(payload.new as SupabaseNotification);
          console.log('Transformed enhanced notification:', notification);
          callback(notification);
        }
      )
      .subscribe((status) => {
        console.log('Enhanced notification subscription status:', status, 'for channel:', channelName);
      });

    console.log('Subscribed to enhanced notifications channel:', channelName);
    return {
      unsubscribe: () => {
        console.log('Unsubscribing from enhanced notifications channel:', channelName);
        isSubscribed = false;
        supabase.removeChannel(channel);
      }
    };
  },

  // Add a notification
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const { type, title, message, appointmentId, targetDoctorName } = notification;
    console.log('Adding notification to database:', { type, title, message, appointmentId, targetDoctorName });
    
    const { error } = await supabase.from('notifications').insert({
      type,
      title,
      message,
      read: false,
      appointment_id: appointmentId || null,
      target_doctor_name: targetDoctorName || null,
      timestamp: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
    
    console.log('Notification added successfully');
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    console.log('Marking all notifications as read');
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
    console.log('All notifications marked as read');
  },

  // Mark all as unread
  async markAllAsUnread(ids: string[]) {
    if (!ids.length) return;
    console.log('Marking notifications as unread:', ids);
    const { error } = await supabase.from('notifications').update({ read: false }).in('id', ids);
    if (error) {
      console.error('Error marking notifications as unread:', error);
      throw error;
    }
    console.log('Notifications marked as unread');
  },

  // Get notifications (optionally for a doctor)
  async getNotifications(targetDoctorName?: string): Promise<Notification[]> {
    console.log('Getting notifications for doctor:', targetDoctorName);
    let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (targetDoctorName) {
      query = query.eq('target_doctor_name', targetDoctorName);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
    console.log('Found notifications:', data);
    return (data as SupabaseNotification[]).map(this.transformToNotification);
  },

  // Subscribe to all notifications with optional doctor filter and unique channel names
  subscribeToAllNotifications(callback: (notifications: Notification[]) => void, targetDoctorName?: string) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const channelName = targetDoctorName 
      ? `notifications_all_enhanced_${targetDoctorName}_${timestamp}_${randomId}`
      : `notifications_all_enhanced_${timestamp}_${randomId}`;
    
    console.log('Setting up enhanced all notifications subscription:', channelName);
    
    let isSubscribed = true;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async () => {
          if (!isSubscribed) return;
          
          console.log('Received enhanced notifications update');
          try {
            const notifications = await this.getNotifications(targetDoctorName);
            console.log('Fetched updated enhanced notifications:', notifications);
            callback(notifications);
          } catch (error) {
            console.error('Error fetching updated notifications:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Enhanced all notifications subscription status:', status);
      });

    // Initial fetch
    this.getNotifications(targetDoctorName)
      .then((notifications) => {
        if (isSubscribed) {
          callback(notifications);
        }
      })
      .catch(error => {
        if (isSubscribed) {
          console.error('Error in initial notifications fetch:', error);
        }
      });

    return () => {
      console.log('Unsubscribing from enhanced all notifications channel:', channelName);
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  },
}; 
