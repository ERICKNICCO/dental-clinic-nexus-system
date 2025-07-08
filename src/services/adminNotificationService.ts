
import { supabaseNotificationService } from './supabaseNotificationService';

export interface ConsultationCompletedNotification {
  patientId: string;
  patientName: string;
  doctorName: string;
  consultationId: string;
  diagnosis?: string;
  estimatedCost?: number;
  appointmentId?: string;
}

export const adminNotificationService = {
  async notifyAdminForConsultationCompleted(data: ConsultationCompletedNotification) {
    console.log('🔥 Notifying admin for completed consultation:', data);
    
    try {
      await supabaseNotificationService.createNotification({
        type: 'consultation_completed',
        title: 'Consultation Completed - Payment Required',
        message: `Dr. ${data.doctorName} has completed consultation for ${data.patientName}. ${data.diagnosis ? `Diagnosis: ${data.diagnosis}.` : ''} Please proceed with payment collection.`,
        target_role: 'admin',
        appointment_id: data.appointmentId
      });
      // Notify doctor
      await supabaseNotificationService.createNotification({
        type: 'consultation_completed',
        title: 'Consultation Completed',
        message: `You have completed the consultation for ${data.patientName}.`,
        target_role: 'doctor',
        target_user: data.doctorName,
        appointment_id: data.appointmentId
      });
      // Optionally notify patient
      if (data.patientName) {
        await supabaseNotificationService.createNotification({
          type: 'consultation_completed',
          title: 'Consultation Completed',
          message: `Your consultation with Dr. ${data.doctorName} is completed. Please proceed to payment.`,
          target_user: data.patientName,
          appointment_id: data.appointmentId
        });
      }
      console.log('✅ Admin, doctor, and patient notified for completed consultation');
    } catch (error) {
      console.error('❌ Error sending admin/doctor/patient notification:', error);
      throw error;
    }
  },

  async notifyAdminForPaymentCollection(data: {
    patientId: string;
    patientName: string;
    diagnosis: string;
    estimatedCost: number;
    consultationId: string;
    appointmentId?: string;
  }) {
    console.log('🔥 Notifying admin for payment collection:', data);
    
    try {
      await supabaseNotificationService.createNotification({
        type: 'payment_required',
        title: 'Payment Collection Required',
        message: `Payment collection needed for ${data.patientName}. Treatment: ${data.diagnosis}. Estimated cost: ${data.estimatedCost.toLocaleString()} UGX.`,
        target_doctor_name: 'admin', // Send specifically to admin
        appointment_id: data.appointmentId
      });
      
      console.log('✅ Admin notification sent for payment collection');
    } catch (error) {
      console.error('❌ Error notifying admin for payment:', error);
      throw error;
    }
  }
};
