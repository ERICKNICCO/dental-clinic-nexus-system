import { supabase } from '../integrations/supabase/client';

export interface Payment {
  id: string;
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  total_amount: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'claim_submitted';
  payment_method: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  appointment_id?: string;
  consultation_id?: string;
  insurance_provider?: string;
  collected_by?: string;
}

export const paymentService = {
  // Format price for display - FIXED CURRENCY
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Tsh';
  },

  // Get all payments
  async getAllPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw new Error('Failed to fetch payments');
      }

      return data as Payment[];
    } catch (error) {
      console.error('Error in getAllPayments:', error);
      throw error;
    }
  },

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching payment:', error);
        return null;
      }

      return data as Payment;
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      return null;
    }
  },

  // Create a new payment record
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'payment_date'>): Promise<Payment> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            ...paymentData,
            payment_date: new Date().toISOString() // Set current date as payment_date
          }
        ])
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        throw new Error('Failed to create payment');
      }

      return data as Payment;
    } catch (error) {
      console.error('Error in createPayment:', error);
      throw error;
    }
  },

  // Update an existing payment record
  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error updating payment:', error);
        return null;
      }

      return data as Payment;
    } catch (error) {
      console.error('Error in updatePayment:', error);
      return null;
    }
  },

  // Delete a payment record
  async deletePayment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePayment:', error);
      return false;
    }
  },

  // Record a payment
  async recordPayment(paymentId: string, amountPaid: number, paymentMethod: string, collectedBy: string, notes?: string): Promise<Payment> {
    try {
      // Fetch the existing payment record
      const { data: existingPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing payment:', fetchError);
        throw new Error('Failed to fetch existing payment');
      }

      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      // Calculate the new amount paid and the remaining balance
      const newAmountPaid = (existingPayment.amount_paid || 0) + amountPaid;
      const remainingBalance = existingPayment.total_amount - newAmountPaid;

      // Determine the new payment status
      let newPaymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
      if (newAmountPaid >= existingPayment.total_amount) {
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partial';
      }

      // Update the payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          amount_paid: newAmountPaid,
          payment_status: newPaymentStatus,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          collected_by: collectedBy,
          notes: notes,
        })
        .eq('id', paymentId)
        .single();

      if (updateError) {
        console.error('Error recording payment:', updateError);
        throw new Error('Failed to record payment');
      }

      if (!updatedPayment) {
        throw new Error('Failed to update payment record');
      }

      // If payment is complete, trigger checkout process
      if (newPaymentStatus === 'paid') {
        console.log('Payment is complete, triggering checkout process');
        // await this.handleCheckoutProcess(paymentId);
      }

      return updatedPayment as Payment;
    } catch (error) {
      console.error('Error in recordPayment:', error);
      throw error;
    }
  },

  async getPaymentByAppointmentId(appointmentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();
      if (error) {
        console.error('Error fetching payment by appointment_id:', error);
        return null;
      }
      return data as Payment;
    } catch (error) {
      console.error('Error in getPaymentByAppointmentId:', error);
      return null;
    }
  },
};
