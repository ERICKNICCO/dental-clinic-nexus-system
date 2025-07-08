import React, { useEffect, useState } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { paymentService } from '../../services/paymentService';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

// Brand colors
const brandBlue = 'rgba(51, 195, 240, 1)'; // #33C3F0
const brandBlueLight = 'rgba(51, 195, 240, 0.1)';

const RevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (Tsh)',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: brandBlueLight,
        borderColor: brandBlue,
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      const payments = await paymentService.getAllPayments();
      const currentYear = new Date().getFullYear();
      
      // Initialize monthly revenue data
      const monthlyRevenue = new Array(6).fill(0); // Last 6 months
      const monthLabels = [];
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthLabels.push(date.toLocaleString('default', { month: 'short' }));
      }

      // Calculate revenue by month
      payments.forEach(payment => {
        const paymentDate = new Date(payment.created_at);
        const monthDiff = new Date().getMonth() - paymentDate.getMonth();
        const yearDiff = new Date().getFullYear() - paymentDate.getFullYear();
        
        if (yearDiff === 0 && monthDiff >= 0 && monthDiff < 6) {
          const monthIndex = 5 - monthDiff;
          monthlyRevenue[monthIndex] += payment.amount_paid / 100; // Convert from cents
        }
      });

      setChartData({
        labels: monthLabels,
        datasets: [
          {
            label: 'Revenue (Tsh)',
            data: monthlyRevenue,
            backgroundColor: brandBlueLight,
            borderColor: brandBlue,
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            return 'Tsh ' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
        <div className="flex items-center justify-center h-64">
          <span>Loading revenue data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RevenueChart;
