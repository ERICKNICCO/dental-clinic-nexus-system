
import { useState, useEffect } from 'react';
import { supabaseTreatmentPricingService, TreatmentPricing } from '../services/supabaseTreatmentPricingService';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseTreatmentPricing = () => {
  const [treatments, setTreatments] = useState<TreatmentPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const loadTreatments = async () => {
      try {
        const treatmentsData = await supabaseTreatmentPricingService.getTreatments();
        setTreatments(treatmentsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading treatments:', err);
        setError('Failed to load treatments');
        setLoading(false);
      }
    };

    const setupSubscription = () => {
      channel = supabaseTreatmentPricingService.subscribeToTreatmentPricing(setTreatments);
    };

    loadTreatments().then(setupSubscription);

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const addTreatment = async (treatmentData: Omit<TreatmentPricing, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await supabaseTreatmentPricingService.addTreatment(treatmentData);
    } catch (err) {
      console.error('Error adding treatment:', err);
      setError('Failed to add treatment');
      throw err;
    }
  };

  const updateTreatment = async (id: string, updates: Partial<TreatmentPricing>) => {
    try {
      await supabaseTreatmentPricingService.updateTreatment(id, updates);
    } catch (err) {
      console.error('Error updating treatment:', err);
      setError('Failed to update treatment');
      throw err;
    }
  };

  const deleteTreatment = async (id: string) => {
    try {
      await supabaseTreatmentPricingService.deleteTreatment(id);
    } catch (err) {
      console.error('Error deleting treatment:', err);
      setError('Failed to delete treatment');
      throw err;
    }
  };

  return {
    treatments,
    loading,
    error,
    addTreatment,
    updateTreatment,
    deleteTreatment
  };
};
