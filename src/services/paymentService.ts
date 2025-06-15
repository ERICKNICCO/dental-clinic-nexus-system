
import { supabase } from '../integrations/supabase/client';

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
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async recordPayment(paymentId: string, amountPaid: number, paymentMethod: string, collectedBy: string, notes?: string): Promise<Payment> {
    // Get current payment
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    const newAmountPaid = currentPayment.amount_paid + amountPaid;
    const newStatus = newAmountPaid >= currentPayment.total_amount ? 'paid' : 
                     newAmountPaid > 0 ? 'partial' : 'pending';

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

    if (error) throw error;
    return data;
  },

  formatPrice(amountInCents: number): string {
    return `Tsh ${(amountInCents / 100).toLocaleString()}`;
  }
};
