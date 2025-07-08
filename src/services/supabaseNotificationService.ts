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
      target_role: data.target_role,
      target_user: data.target_user,
    };
  },

  // Create a new notification for new appointments
  async createAppointmentNotification(appointmentData: any) {
    console.log('🔥 Creating appointment notification for:', appointmentData);
    
    const notification = {
      type: 'new_appointment',
      title: 'New Appointment Scheduled',
      message: `New appointment scheduled with ${appointmentData.patient?.name || appointmentData.patient_name} for ${appointmentData.treatment} on ${appointmentData.date} at ${appointmentData.time}`,
      appointment_id: appointmentData.id,
      target_doctor_name: appointmentData.dentist,
      timestamp: new Date().toISOString(),
      read: false
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating appointment notification:', error);
      throw error;
    }

    console.log('✅ Appointment notification created:', data);
    return this.transformToNotification(data);
  },

  // Create a new notification
  async createNotification(notification: Omit<SupabaseNotification, 'id' | 'timestamp' | 'read'> & { target_role?: string, target_user?: string }) {
    console.log('🔥 Creating notification:', notification);
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
        appointment_id: notification.appointment_id || null,
        target_doctor_name: notification.target_doctor_name || null,
        target_role: notification.target_role || null,
        target_user: notification.target_user || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }

    console.log('✅ Created notification:', data);
    return this.transformToNotification(data);
  },

  // Get all unread notifications for a doctor, admin, or user
  async getUnreadNotifications(target: string): Promise<Notification[]> {
    console.log('🔥 Getting unread notifications for target:', target);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_role.eq.${target},target_user.eq.${target}`)
      .eq('read', false)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Error fetching unread notifications:', error);
      throw error;
    }

    console.log('✅ Found unread notifications:', data);
    return (data as SupabaseNotification[]).map(this.transformToNotification);
  },

  // Mark a notification as read
  async markAsRead(notificationId: string) {
    console.log('🔥 Marking notification as read:', notificationId);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
    console.log('✅ Marked notification as read:', notificationId);
  },

  // Subscribe to notifications for a specific doctor or admin
  subscribeToNotifications(target: string, callback: (notification: Notification) => void) {
    console.log('🔥 Setting up notification subscription for target:', target);
    const channelName = `notifications_${target}`;
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
          console.log('🔥 Received notification payload:', payload);
          const newNotification = payload.new as SupabaseNotification;
          // Check if this notification is for this role/user
          if (
            newNotification.target_role === target ||
            newNotification.target_user === target ||
            newNotification.target_role === null // fallback for global
          ) {
            const notification = this.transformToNotification(newNotification);
            console.log('✅ Transformed notification for target:', notification);
            callback(notification);
          }
        }
      )
      .subscribe();

    console.log('✅ Subscribed to notifications channel:', channelName);
    return {
      unsubscribe: () => {
        console.log('🔥 Unsubscribing from notifications channel:', channelName);
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
    console.log('🔥 Getting notifications for doctor:', targetDoctorName);
    let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (targetDoctorName) {
      query = query.eq('target_doctor_name', targetDoctorName);
    }
    const { data, error } = await query;
    if (error) throw error;
    console.log('✅ Found notifications:', data);
    return (data as SupabaseNotification[]).map(this.transformToNotification);
  },

  // Subscribe to all notifications with optional doctor filter
  subscribeToAllNotifications(callback: (notifications: Notification[]) => void, targetDoctorName?: string) {
    const channelName = targetDoctorName 
      ? `notifications_all_${targetDoctorName}`
      : `notifications_all`;
    
    console.log('🔥 Setting up all notifications subscription:', channelName);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async () => {
          console.log('🔥 Received notifications update');
          const notifications = await this.getNotifications(targetDoctorName);
          console.log('✅ Fetched updated notifications:', notifications);
          callback(notifications);
        }
      )
      .subscribe();

    // Initial fetch
    this.getNotifications(targetDoctorName).then(callback);

    return () => {
      console.log('🔥 Unsubscribing from all notifications channel:', channelName);
      supabase.removeChannel(channel);
    };
  },
};
