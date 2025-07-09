import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PaymentData {
  amountPaid: number;
  date: string; // YYYY-MM-DD format
  type?: 'revenue' | 'expense'; // To differentiate between revenue and expenses
}

interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
}

export const financeService = {
  async getMonthlyFinancialData(year: number): Promise<MonthlyFinancialData[]> {
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};

    // Initialize data for all 12 months
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(year, i).toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = { revenue: 0, expenses: 0 };
    }

    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('date', '>=', `${year}-01-01`),
        where('date', '<=', `${year}-12-31`),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);

      snapshot.forEach(doc => {
        const data = doc.data() as PaymentData;
        const month = new Date(data.date).toLocaleString('default', { month: 'short' });
        const amount = Number(data.amountPaid) || 0;

        if (data.type === 'expense') {
          monthlyData[month].expenses += amount;
        } else {
          monthlyData[month].revenue += amount;
        }
      });

      // Convert to array in correct month order
      const orderedMonths = Array.from({ length: 12 }, (_, i) => new Date(year, i).toLocaleString('default', { month: 'short' }));
      return orderedMonths.map(month => ({
        month,
        revenue: monthlyData[month].revenue,
        expenses: monthlyData[month].expenses,
      }));

    } catch (error) {
      console.error('Error fetching monthly financial data:', error);
      throw error;
    }
  },

  async getTotalRevenue(year: number): Promise<number> {
    let totalRevenue = 0;
    try {
      const monthlyData = await this.getMonthlyFinancialData(year);
      totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      throw error;
    }
    return totalRevenue;
  },

  async getTotalExpenses(year: number): Promise<number> {
    let totalExpenses = 0;
    try {
      const monthlyData = await this.getMonthlyFinancialData(year);
      totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
    } catch (error) {
      console.error('Error calculating total expenses:', error);
      throw error;
    }
    return totalExpenses;
  },

  async getNetProfit(year: number): Promise<number> {
    let netProfit = 0;
    try {
      const totalRevenue = await this.getTotalRevenue(year);
      const totalExpenses = await this.getTotalExpenses(year);
      netProfit = totalRevenue - totalExpenses;
    } catch (error) {
      console.error('Error calculating net profit:', error);
      throw error;
    }
    return netProfit;
  }
}; 