
import { supabase } from '../integrations/supabase/client';

export interface TreatmentPricing {
  id: string;
  name: string;
  category: string;
  basePrice: number; // in cents
  duration: number; // in minutes
  description?: string;
  isActive: boolean;
  insuranceProvider: string; // 'cash', 'NHIF', 'GA', etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceProvider {
  code: string;
  name: string;
}

export const supabaseTreatmentPricingService = {
  // Get all available insurance providers
  async getInsuranceProviders(): Promise<InsuranceProvider[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_pricing')
        .select('insurance_provider')
        .neq('insurance_provider', 'cash');

      if (error) throw error;

      // Get unique insurance providers
      const uniqueProviders = [...new Set(data.map(item => item.insurance_provider))]
        .filter(provider => provider && provider !== 'cash')
        .map(provider => ({
          code: provider,
          name: provider.toUpperCase()
        }));

      return [
        { code: 'cash', name: 'Cash' },
        ...uniqueProviders
      ];
    } catch (error) {
      console.error('Error fetching insurance providers:', error);
      return [{ code: 'cash', name: 'Cash' }];
    }
  },

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
          is_active: treatmentData.isActive,
          insurance_provider: treatmentData.insuranceProvider
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
        .order('name', { ascending: true })
        .order('insurance_provider', { ascending: true });

      if (error) throw error;

      return data.map(treatment => ({
        id: treatment.id,
        name: treatment.name,
        category: treatment.category,
        basePrice: treatment.base_price,
        duration: treatment.duration,
        description: treatment.description || undefined,
        isActive: treatment.is_active,
        insuranceProvider: treatment.insurance_provider,
        createdAt: new Date(treatment.created_at),
        updatedAt: new Date(treatment.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching treatment pricing:', error);
      throw error;
    }
  },

  // Get treatments by insurance provider
  async getTreatmentsByInsurance(insuranceProvider: string): Promise<TreatmentPricing[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_pricing')
        .select('*')
        .eq('insurance_provider', insuranceProvider)
        .eq('is_active', true)
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
        insuranceProvider: treatment.insurance_provider,
        createdAt: new Date(treatment.created_at),
        updatedAt: new Date(treatment.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching treatments by insurance:', error);
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
      if (updates.insuranceProvider !== undefined) updateData.insurance_provider = updates.insuranceProvider;

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

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('TZS', 'Tsh');
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
