import { supabase } from '../integrations/supabase/client';

export interface EmailNotificationData {
  appointmentId: string;
  recipientEmail: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  treatment: string;
  dentist: string;
  emailType: 'confirmation' | 'approval' | 'reminder' | 'cancellation';
}

export interface EmailLogData {
  appointment_id: string;
  recipient_email: string;
  email_type: string;
  subject: string;
  status: 'sent' | 'failed';
  error_message?: string | null;
  sent_at: string;
}

export const emailNotificationService = {
  // Send email notification using Supabase Edge Function
  async sendAppointmentEmail(emailData: EmailNotificationData): Promise<boolean> {
    try {
      console.log('🔥 EmailNotificationService: Sending email for appointment:', emailData.appointmentId);
      console.log('📧 EmailNotificationService: Recipient:', emailData.recipientEmail);
      console.log('📧 EmailNotificationService: Type:', emailData.emailType);

      if (!emailData.recipientEmail) {
        console.error('❌ EmailNotificationService: No recipient email provided');
        await this.logEmailNotification({
          appointment_id: emailData.appointmentId,
          recipient_email: 'unknown',
          email_type: emailData.emailType,
          subject: this.getEmailSubject(emailData.emailType, emailData.patientName),
          status: 'failed',
          error_message: 'No recipient email provided',
          sent_at: new Date().toISOString()
        });
        return false;
      }

      // Call Supabase Edge Function
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-appointment-email', {
        body: emailData
      });

      if (emailError) {
        console.error('❌ EmailNotificationService: Error sending email:', emailError);
        
        // Log failed email
        await this.logEmailNotification({
          appointment_id: emailData.appointmentId,
          recipient_email: emailData.recipientEmail,
          email_type: emailData.emailType,
          subject: this.getEmailSubject(emailData.emailType, emailData.patientName),
          status: 'failed',
          error_message: emailError.message,
          sent_at: new Date().toISOString()
        });
        
        return false;
      }

      console.log('✅ EmailNotificationService: Email sent successfully:', emailResponse);
      
      // Log successful email
      await this.logEmailNotification({
        appointment_id: emailData.appointmentId,
        recipient_email: emailData.recipientEmail,
        email_type: emailData.emailType,
        subject: this.getEmailSubject(emailData.emailType, emailData.patientName),
        status: 'sent',
        sent_at: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('❌ EmailNotificationService: Error in sendAppointmentEmail:', error);
      
      // Log error
      try {
        await this.logEmailNotification({
          appointment_id: emailData.appointmentId,
          recipient_email: emailData.recipientEmail || 'unknown',
          email_type: emailData.emailType,
          subject: this.getEmailSubject(emailData.emailType, emailData.patientName),
          status: 'failed',
          error_message: (error as Error).message,
          sent_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('❌ EmailNotificationService: Error logging email failure:', logError);
      }
      
      return false;
    }
  },

  // Send email for Supabase appointment
  async sendEmailForSupabaseAppointment(
    appointmentId: string, 
    emailType: 'confirmation' | 'approval' | 'reminder' | 'cancellation'
  ): Promise<boolean> {
    try {
      console.log('🔥 EmailNotificationService: Fetching Supabase appointment for email:', appointmentId);
      
      // Get appointment details from Supabase
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        console.error('❌ EmailNotificationService: Error fetching appointment:', error);
        return false;
      }

      console.log('📧 EmailNotificationService: Appointment data:', appointment);

      if (!appointment.patient_email) {
        console.log('⚠️ EmailNotificationService: No email address for patient, skipping email notification');
        return false;
      }

      // Prepare email data
      const emailData: EmailNotificationData = {
        appointmentId: appointment.id,
        recipientEmail: appointment.patient_email,
        patientName: appointment.patient_name,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        treatment: appointment.treatment,
        dentist: appointment.dentist,
        emailType: emailType
      };

      // Send email
      return await this.sendAppointmentEmail(emailData);
    } catch (error) {
      console.error('❌ EmailNotificationService: Error in sendEmailForSupabaseAppointment:', error);
      return false;
    }
  },

  // Send email for Firebase appointment (for backward compatibility)
  async sendEmailForFirebaseAppointment(
    appointment: {
      id: string;
      patient: { name: string; email: string };
      date: string;
      time: string;
      treatment: string;
      dentist: string;
    },
    emailType: 'confirmation' | 'approval' | 'reminder' | 'cancellation'
  ): Promise<boolean> {
    try {
      console.log('🔥 EmailNotificationService: Sending email for Firebase appointment:', appointment.id);

      if (!appointment.patient?.email) {
        console.log('⚠️ EmailNotificationService: No email address for patient, skipping email notification');
        return false;
      }

      // Prepare email data
      const emailData: EmailNotificationData = {
        appointmentId: appointment.id,
        recipientEmail: appointment.patient.email,
        patientName: appointment.patient.name,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        treatment: appointment.treatment,
        dentist: appointment.dentist,
        emailType: emailType
      };

      // Send email
      return await this.sendAppointmentEmail(emailData);
    } catch (error) {
      console.error('❌ EmailNotificationService: Error in sendEmailForFirebaseAppointment:', error);
      return false;
    }
  },

  // Log email notification to database
  async logEmailNotification(logData: EmailLogData): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_notifications')
        .insert(logData);

      if (error) {
        console.error('❌ EmailNotificationService: Error logging email notification:', error);
      } else {
        console.log('📝 EmailNotificationService: Email notification logged successfully');
      }
    } catch (error) {
      console.error('❌ EmailNotificationService: Error in logEmailNotification:', error);
    }
  },

  // Get email notifications for an appointment
  async getEmailNotificationsForAppointment(appointmentId: string): Promise<EmailLogData[]> {
    try {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ EmailNotificationService: Error fetching email notifications:', error);
        return [];
      }

      // Transform the data to match our interface
      return (data || []).map(item => ({
        appointment_id: item.appointment_id,
        recipient_email: item.recipient_email,
        email_type: item.email_type,
        subject: item.subject,
        status: item.status as 'sent' | 'failed',
        error_message: item.error_message,
        sent_at: item.sent_at
      }));
    } catch (error) {
      console.error('❌ EmailNotificationService: Error in getEmailNotificationsForAppointment:', error);
      return [];
    }
  },

  // Get email subject based on type
  getEmailSubject(emailType: string, patientName: string): string {
    switch (emailType) {
      case 'confirmation':
        return `Appointment Confirmed - ${patientName}`;
      case 'approval':
        return `Appointment Approved - ${patientName}`;
      case 'reminder':
        return `Appointment Reminder - ${patientName}`;
      case 'cancellation':
        return `Appointment Cancelled - ${patientName}`;
      default:
        return `Appointment Update - ${patientName}`;
    }
  },

  // Check if email service is available
  async checkEmailServiceStatus(): Promise<boolean> {
    try {
      // Try to invoke the edge function with a test payload
      const { error } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          appointmentId: 'test',
          recipientEmail: 'test@example.com',
          patientName: 'Test Patient',
          appointmentDate: '2024-01-01',
          appointmentTime: '10:00',
          treatment: 'Test Treatment',
          dentist: 'Test Doctor',
          emailType: 'confirmation'
        }
      });

      // If we get an error about missing API key, the service is configured but needs the key
      if (error && error.message.includes('RESEND_API_KEY')) {
        console.log('⚠️ EmailNotificationService: Email service configured but missing RESEND_API_KEY');
        return false;
      }

      // If we get any other error, the service might be working
      console.log('✅ EmailNotificationService: Email service appears to be available');
      return true;
    } catch (error) {
      console.error('❌ EmailNotificationService: Error checking email service status:', error);
      return false;
    }
  }
}; 