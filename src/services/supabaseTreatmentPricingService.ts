
import { supabase } from '../integrations/supabase/client';

export interface TreatmentPricing {
  id: string;
  name: string;
  category: string;
  base_price: number; // Price in cents
  duration: number; // Duration in minutes
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const supabaseTreatmentPricingService = {
  // Add treatment pricing
  async addTreatment(treatmentData: Omit<TreatmentPricing, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('treatment_pricing')
      .insert([treatmentData])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  // Get all treatment pricing
  async getTreatments(): Promise<TreatmentPricing[]> {
    const { data, error } = await supabase
      .from('treatment_pricing')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map(treatment => ({
      ...treatment,
      created_at: new Date(treatment.created_at),
      updated_at: new Date(treatment.updated_at)
    }));
  },

  // Get active treatments only
  async getActiveTreatments(): Promise<TreatmentPricing[]> {
    const { data, error } = await supabase
      .from('treatment_pricing')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map(treatment => ({
      ...treatment,
      created_at: new Date(treatment.created_at),
      updated_at: new Date(treatment.updated_at)
    }));
  },

  // Update treatment pricing
  async updateTreatment(id: string, updates: Partial<TreatmentPricing>): Promise<void> {
    const { error } = await supabase
      .from('treatment_pricing')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  // Delete treatment pricing
  async deleteTreatment(id: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_pricing')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Subscribe to treatment pricing changes
  subscribeToTreatmentPricing(callback: (treatments: TreatmentPricing[]) => void) {
    return supabase
      .channel('treatment_pricing')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_pricing'
        },
        async () => {
          const treatments = await this.getTreatments();
          callback(treatments);
        }
      )
      .subscribe();
  }
};
