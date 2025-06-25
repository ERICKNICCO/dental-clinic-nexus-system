
import { supabase } from '../integrations/supabase/client';
import { paymentUtils } from '../utils/paymentUtils';
import { supabaseAppointmentService } from './supabaseAppointmentService';
import { supabaseConsultationService } from './supabaseConsultationService';

export interface Payment {
  id: string;
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  appointment_id?: string;
  consultation_id?: string;
  total_amount: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance';
  insurance_provider?: string;
  collected_by?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentItem {
  id: string;
  payment_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const paymentService = {
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    console.log('🔥 PaymentService: Creating payment with data:', paymentData);
    
    // Validate and correct payment data using utility functions
    const validation = await paymentUtils.validatePaymentData(paymentData);
    
    if (validation.correctedPatientId) {
      paymentData.patient_id = validation.correctedPatientId;
      console.log('✅ PaymentService: Using corrected patient ID:', validation.correctedPatientId);
    }
    
    if (validation.correctedAppointmentId) {
      paymentData.appointment_id = validation.correctedAppointmentId;
      console.log('✅ PaymentService: Using corrected appointment ID:', validation.correctedAppointmentId);
    }
    
    if (validation.errors.length > 0) {
      console.log('⚠️ PaymentService: Validation warnings:', validation.errors);
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      console.error('❌ PaymentService: Error creating payment:', error);
      throw error;
    }
    
    console.log('✅ PaymentService: Payment created successfully:', data);
    return data as Payment;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  },

  async getPayment(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data as Payment;
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async recordPayment(paymentId: string, amountPaid: number, paymentMethod: string, collectedBy: string, notes?: string): Promise<Payment> {
    console.log('🔥 PaymentService: Recording payment for ID:', paymentId, 'Amount:', amountPaid);
    
    // Get current payment
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError) {
      console.error('❌ PaymentService: Error fetching payment:', fetchError);
      throw fetchError;
    }

    console.log('🔥 PaymentService: Current payment data:', currentPayment);

    const newAmountPaid = currentPayment.amount_paid + amountPaid;
    const newStatus = newAmountPaid >= currentPayment.total_amount ? 'paid' : 
                     newAmountPaid > 0 ? 'partial' : 'pending';

    console.log('🔥 PaymentService: New amount paid:', newAmountPaid, 'New status:', newStatus);

    const { data, error } = await supabase
      .from('payments')
      .update({
        amount_paid: newAmountPaid,
        payment_status: newStatus,
        payment_method: paymentMethod,
        collected_by: collectedBy,
        payment_date: new Date().toISOString().split('T')[0],
        notes: notes
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('❌ PaymentService: Error updating payment:', error);
      throw error;
    }

    const updatedPayment = data as Payment;
    console.log('✅ PaymentService: Payment updated successfully:', updatedPayment);

    // If payment is complete, automatically handle checkout
    if (updatedPayment.payment_status === 'paid') {
      console.log('🔥 PaymentService: Payment is complete, triggering checkout process');
      await this.handleCheckoutProcess(updatedPayment);
    }

    return updatedPayment;
  },

  async handleCheckoutProcess(payment: Payment): Promise<void> {
    try {
      console.log('🔥 PaymentService: Starting checkout process for payment:', payment.id);
      console.log('🔥 PaymentService: Payment details:', {
        appointment_id: payment.appointment_id,
        consultation_id: payment.consultation_id,
        patient_id: payment.patient_id,
        patient_name: payment.patient_name
      });
      
      // Update appointment status to "Checked Out" if appointment_id exists
      if (payment.appointment_id) {
        console.log('🔥 PaymentService: Updating appointment status to Checked Out for ID:', payment.appointment_id);
        try {
          await supabaseAppointmentService.updateAppointment(payment.appointment_id, { 
            status: 'Checked Out' 
          });
          console.log('✅ PaymentService: Appointment status updated to Checked Out');
        } catch (appointmentError) {
          console.error('❌ PaymentService: Error updating appointment:', appointmentError);
          // Try to find appointment by patient name if direct ID fails
          console.log('🔥 PaymentService: Attempting to find appointment by patient name');
          const foundAppointmentId = await paymentUtils.findAppointmentIdByPatientName(payment.patient_name);
          if (foundAppointmentId) {
            console.log('🔥 PaymentService: Found appointment by patient name:', foundAppointmentId);
            await supabaseAppointmentService.updateAppointment(foundAppointmentId, { 
              status: 'Checked Out' 
            });
            console.log('✅ PaymentService: Appointment status updated using found ID');
          } else {
            console.warn('⚠️ PaymentService: Could not find appointment to update status');
          }
        }
      }

      // Complete consultation if consultation_id exists
      if (payment.consultation_id) {
        console.log('🔥 PaymentService: Completing consultation for ID:', payment.consultation_id);
        try {
          await supabaseConsultationService.completeConsultation(payment.consultation_id, {});
          console.log('✅ PaymentService: Consultation completed successfully');
        } catch (consultationError) {
          console.warn('⚠️ PaymentService: Could not complete consultation by ID:', consultationError);
        }
      } else if (payment.patient_id) {
        // Try to find and complete active consultation by patient_id
        try {
          console.log('🔥 PaymentService: Looking for active consultation for patient:', payment.patient_id);
          const activeConsultation = await supabaseConsultationService.getActiveConsultation(payment.patient_id);
          if (activeConsultation) {
            console.log('🔥 PaymentService: Found active consultation, completing:', activeConsultation.id);
            await supabaseConsultationService.completeConsultation(activeConsultation.id, {});
            console.log('✅ PaymentService: Active consultation completed successfully');
          } else {
            console.log('🔥 PaymentService: No active consultation found for patient');
          }
        } catch (consultationError) {
          console.warn('⚠️ PaymentService: Could not complete consultation:', consultationError);
        }
      }

      console.log('✅ PaymentService: Checkout process completed successfully');
    } catch (error) {
      console.error('❌ PaymentService: Error during checkout:', error);
      throw error;
    }
  },

  // Use the utility function for formatting
  formatPrice: paymentUtils.formatPrice,

  async validateAndCorrectPatientId(patientName: string, providedPatientId?: string): Promise<string> {
    return paymentUtils.validateAndCorrectPatientId(patientName, providedPatientId);
  },

  async findAppointmentIdByPatientName(patientName: string): Promise<string | null> {
    return paymentUtils.findAppointmentIdByPatientName(patientName);
  }
};
