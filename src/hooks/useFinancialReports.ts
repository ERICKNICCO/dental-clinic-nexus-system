import { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { paymentService } from '../services/paymentService';

export function useFinancialReports() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinancialData() {
      setLoading(true);
      setError(null);
      const currentYear = new Date().getFullYear();

      try {
        // Fetch all payments from Supabase
        const allPayments = await paymentService.getAllPayments();
        // Filter payments for current year
        const paymentsThisYear = allPayments.filter(payment => {
          const date = new Date(payment.created_at);
          return date.getFullYear() === currentYear;
        });
        // Sum up amount_paid (in cents)
        const revenueCents = paymentsThisYear.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        // Convert to Tsh
        setTotalRevenue(Math.round(revenueCents / 100));

        // Optionally, set monthlyData for charts (not implemented here)
        setMonthlyData([]);
        setTotalExpenses(0);
        setNetProfit(Math.round(revenueCents / 100));
      } catch (err) {
        console.error('Error fetching financial reports:', err);
        setError('Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialData();
  }, []);

  return { monthlyData, totalRevenue, totalExpenses, netProfit, loading, error };
} 