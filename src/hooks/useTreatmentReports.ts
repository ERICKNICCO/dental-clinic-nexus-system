import { useEffect, useState } from 'react';

interface TreatmentDistributionData {
  name: string;
  value: number;
}

export const useTreatmentReports = () => {
  // Placeholder state
  const treatmentDistribution = [];
  const loading = false;
  const error = null;

  // Replace with Supabase logic as needed

  return {
    treatmentDistribution,
    loading,
    error,
  };
}; 