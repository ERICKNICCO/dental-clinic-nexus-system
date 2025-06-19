import { useEffect, useState } from 'react';
import { treatmentReportService } from '../services/treatmentReportService';

interface TreatmentDistributionData {
  name: string;
  value: number;
}

export function useTreatmentReports() {
  const [treatmentDistribution, setTreatmentDistribution] = useState<TreatmentDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTreatmentData() {
      setLoading(true);
      setError(null);

      try {
        const fetchedDistribution = await treatmentReportService.getTreatmentDistribution();
        setTreatmentDistribution(fetchedDistribution);
      } catch (err) {
        console.error('Error fetching treatment reports:', err);
        setError('Failed to load treatment data.');
      } finally {
        setLoading(false);
      }
    }

    fetchTreatmentData();
  }, []);

  return { treatmentDistribution, loading, error };
} 