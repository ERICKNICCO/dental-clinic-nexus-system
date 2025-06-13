import { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';

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
        const fetchedMonthlyData = await financeService.getMonthlyFinancialData(currentYear);
        setMonthlyData(fetchedMonthlyData);

        const fetchedTotalRevenue = await financeService.getTotalRevenue(currentYear);
        setTotalRevenue(fetchedTotalRevenue);

        const fetchedTotalExpenses = await financeService.getTotalExpenses(currentYear);
        setTotalExpenses(fetchedTotalExpenses);

        const fetchedNetProfit = await financeService.getNetProfit(currentYear);
        setNetProfit(fetchedNetProfit);

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