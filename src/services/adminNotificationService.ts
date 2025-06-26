
import { supabase } from '../integrations/supabase/client';

interface PaymentNotificationData {
  patientId: string;
  patientName: string;
  diagnosis: string;
  estimatedCost: number;
  consultationId: string;
  appointmentId?: string;
}

export const adminNotificationService = {
  async notifyAdminForPaymentCollection(data: PaymentNotificationData) {
    try {
      console.log('Creating admin notification for payment collection:', data);
      
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            type: 'payment_collection',
            title: 'Payment Collection Required',
            message: `Patient ${data.patientName} has completed treatment. Diagnosis: ${data.diagnosis}. Estimated cost: UGX ${data.estimatedCost.toLocaleString()}`,
            target_doctor_name: 'admin',
            appointment_id: data.appointmentId,
            read: false
          }
        ]);

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      console.log('Admin notification created successfully');
    } catch (error) {
      console.error('Failed to notify admin:', error);
      throw error;
    }
  }
};
