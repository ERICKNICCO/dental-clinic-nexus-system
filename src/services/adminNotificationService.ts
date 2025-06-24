
import { supabaseNotificationService } from './supabaseNotificationService';
import { emailNotificationService } from './emailNotificationService';

export interface AdminPaymentNotification {
  patientId: string;
  patientName: string;
  diagnosis: string;
  estimatedCost: number;
  consultationId: string;
  appointmentId?: string;
}

export const adminNotificationService = {
  async notifyAdminForPaymentCollection(notification: AdminPaymentNotification) {
    try {
      console.log('🔥 AdminNotificationService: Notifying admin for payment collection:', notification);
      
      // Create notification in the system
      await supabaseNotificationService.createNotification({
        type: 'payment_required',
        title: 'Payment Collection Required',
        message: `Patient ${notification.patientName} needs payment collection for ${notification.diagnosis}. Amount: $${(notification.estimatedCost / 100).toFixed(2)}`,
        target_doctor_name: 'admin', // Target admin users
        appointment_id: notification.appointmentId,
        consultation_id: notification.consultationId
      });

      // Send email to admin (you can configure admin email addresses)
      await emailNotificationService.sendPaymentCollectionNotification({
        patientName: notification.patientName,
        diagnosis: notification.diagnosis,
        estimatedCost: notification.estimatedCost,
        consultationId: notification.consultationId
      });

      console.log('✅ AdminNotificationService: Admin notification sent successfully');
    } catch (error) {
      console.error('❌ AdminNotificationService: Error notifying admin:', error);
      throw error;
    }
  }
};
