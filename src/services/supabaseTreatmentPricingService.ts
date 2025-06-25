
import { supabase } from '../integrations/supabase/client';

export interface TreatmentPricing {
  id: string;
  name: string;
  category: string;
  basePrice: number; // in cents
  duration: number; // in minutes
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const supabaseTreatmentPricingService = {
  // Add a new treatment pricing
  async addTreatment(treatmentData: Omit<TreatmentPricing, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('treatment_pricing')
        .insert({
          name: treatmentData.name,
          category: treatmentData.category,
          base_price: treatmentData.basePrice,
          duration: treatmentData.duration,
          description: treatmentData.description,
          is_active: treatmentData.isActive
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding treatment pricing:', error);
      throw error;
    }
  },

  // Get all treatment pricing
  async getTreatments(): Promise<TreatmentPricing[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_pricing')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(treatment => ({
        id: treatment.id,
        name: treatment.name,
        category: treatment.category,
        basePrice: treatment.base_price,
        duration: treatment.duration,
        description: treatment.description || undefined,
        isActive: treatment.is_active,
        createdAt: new Date(treatment.created_at),
        updatedAt: new Date(treatment.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching treatment pricing:', error);
      throw error;
    }
  },

  // Update treatment pricing
  async updateTreatment(id: string, updates: Partial<TreatmentPricing>) {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('treatment_pricing')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating treatment pricing:', error);
      throw error;
    }
  },

  // Delete treatment pricing
  async deleteTreatment(id: string) {
    try {
      const { error } = await supabase
        .from('treatment_pricing')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting treatment pricing:', error);
      throw error;
    }
  },

  // Subscribe to treatment pricing changes
  subscribeToTreatmentPricing(callback: (treatments: TreatmentPricing[]) => void) {
    const channel = supabase
      .channel('treatment-pricing-changes')
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

    return channel;
  }
};
