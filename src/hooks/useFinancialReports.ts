import { useEffect, useState } from 'react';
import { paymentService } from '../services/paymentService';

export function useFinancialReports() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinancialData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all payments from Supabase
        const allPayments = await paymentService.getAllPayments();
        // Sum up amount_paid for all payments (no year filter, no division)
        const revenue = allPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        setTotalRevenue(revenue);
        setMonthlyData([]);
      } catch (err) {
        console.error('Error fetching financial reports:', err);
        setError('Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    }
    fetchFinancialData();
  }, []);

  return { monthlyData, totalRevenue, loading, error };
} 