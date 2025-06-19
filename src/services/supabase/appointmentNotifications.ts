
import { supabaseNotificationService } from '../supabaseNotificationService';
import { Appointment } from '../../types/appointment';

export const appointmentNotifications = {
  // Create notification for new appointment
  async notifyNewAppointment(appointment: Omit<Appointment, 'id'>, appointmentId: string) {
    try {
      await supabaseNotificationService.createNotification({
        type: 'new_appointment',
        title: 'New Appointment Scheduled',
        message: `New appointment with ${appointment.patient_name} on ${appointment.date} at ${appointment.time}`,
        appointment_id: appointmentId,
        target_doctor_name: appointment.dentist,
      });
      console.log('Notification created for new appointment');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw here to avoid failing the appointment creation
    }
  },

  // Create notification for status changes
  async notifyStatusChange(appointmentId: string, status: string, dentist: string) {
    if (!['Approved', 'Cancelled'].includes(status)) return;

    try {
      await supabaseNotificationService.createNotification({
        type: status === 'Approved' ? 'appointment_approved' : 'appointment_cancelled',
        title: `Appointment ${status}`,
        message: `Your appointment has been ${status.toLowerCase()}`,
        appointment_id: appointmentId,
        target_doctor_name: dentist,
      });
      console.log('Notification created for appointment status change');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }
  }
};
