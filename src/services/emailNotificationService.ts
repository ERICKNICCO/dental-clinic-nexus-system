
import { supabase } from '../integrations/supabase/client';

export interface EmailNotificationData {
  to: string;
  subject: string;
  appointmentDate?: string;
  appointmentTime?: string;
  patientName?: string;
  dentistName?: string;
  treatment?: string;
  appointmentId?: string;
}

export interface PaymentCollectionNotificationData {
  patientName: string;
  diagnosis: string;
  estimatedCost: number;
  consultationId: string;
}

export const emailNotificationService = {
  async sendAppointmentConfirmation(data: EmailNotificationData) {
    try {
      console.log('🔥 EmailNotificationService: Sending appointment confirmation email:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          type: 'confirmation',
          to: data.to,
          subject: data.subject,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          patientName: data.patientName,
          dentistName: data.dentistName,
          treatment: data.treatment,
          appointmentId: data.appointmentId
        }
      });

      if (error) {
        console.error('❌ EmailNotificationService: Error sending confirmation email:', error);
        throw error;
      }

      console.log('✅ EmailNotificationService: Appointment confirmation email sent successfully');
      return result;
    } catch (error) {
      console.error('❌ EmailNotificationService: Failed to send appointment confirmation:', error);
      throw error;
    }
  },

  async sendPaymentCollectionNotification(data: PaymentCollectionNotificationData) {
    try {
      console.log('🔥 EmailNotificationService: Sending payment collection notification:', data);
      
      // Send to admin email (you can configure this)
      const adminEmail = 'admin@clinic.com'; // Configure this based on your needs
      
      const { data: result, error } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          type: 'payment_collection',
          to: adminEmail,
          subject: `Payment Collection Required - ${data.patientName}`,
          patientName: data.patientName,
          diagnosis: data.diagnosis,
          estimatedCost: data.estimatedCost,
          consultationId: data.consultationId
        }
      });

      if (error) {
        console.error('❌ EmailNotificationService: Error sending payment collection email:', error);
        throw error;
      }

      console.log('✅ EmailNotificationService: Payment collection notification sent successfully');
      return result;
    } catch (error) {
      console.error('❌ EmailNotificationService: Failed to send payment collection notification:', error);
      throw error;
    }
  },

  async sendFollowUpReminder(data: EmailNotificationData) {
    try {
      console.log('🔥 EmailNotificationService: Sending follow-up reminder email:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-followup-email', {
        body: {
          to: data.to,
          subject: data.subject,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          patientName: data.patientName,
          dentistName: data.dentistName,
          treatment: data.treatment
        }
      });

      if (error) {
        console.error('❌ EmailNotificationService: Error sending follow-up email:', error);
        throw error;
      }

      console.log('✅ EmailNotificationService: Follow-up reminder email sent successfully');
      return result;
    } catch (error) {
      console.error('❌ EmailNotificationService: Failed to send follow-up reminder:', error);
      throw error;
    }
  }
};
