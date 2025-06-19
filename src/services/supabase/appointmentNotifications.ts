
import { supabaseNotificationService } from '../supabaseNotificationService';
import { Appointment } from '../../types/appointment';

export const appointmentNotifications = {
  // Create notification for new appointment
  async notifyNewAppointment(appointment: Omit<Appointment, 'id'>, appointmentId: string) {
    try {
      console.log('Creating notification for new appointment:', { appointment, appointmentId });
      
      const notification = await supabaseNotificationService.createNotification({
        type: 'new_appointment',
        title: 'New Appointment Scheduled',
        message: `New appointment with ${appointment.patient_name} on ${appointment.date} at ${appointment.time}`,
        appointment_id: appointmentId,
        target_doctor_name: appointment.dentist,
      });
      
      console.log('Notification created successfully for new appointment:', notification);
      return notification;
    } catch (notificationError) {
      console.error('Error creating notification for new appointment:', notificationError);
      // Don't throw here to avoid failing the appointment creation
      throw notificationError;
    }
  },

  // Create notification for status changes
  async notifyStatusChange(appointmentId: string, status: string, dentist: string) {
    if (!['Approved', 'Cancelled'].includes(status)) return;

    try {
      console.log('Creating notification for status change:', { appointmentId, status, dentist });
      
      const notification = await supabaseNotificationService.createNotification({
        type: status === 'Approved' ? 'appointment_approved' : 'appointment_cancelled',
        title: `Appointment ${status}`,
        message: `Your appointment has been ${status.toLowerCase()}`,
        appointment_id: appointmentId,
        target_doctor_name: dentist,
      });
      
      console.log('Notification created successfully for status change:', notification);
      return notification;
    } catch (notificationError) {
      console.error('Error creating notification for status change:', notificationError);
      throw notificationError;
    }
  }
};
