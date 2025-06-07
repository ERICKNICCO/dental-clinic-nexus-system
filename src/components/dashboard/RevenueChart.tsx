
import React from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

// Brand colors
const brandBlue = 'rgba(51, 195, 240, 1)'; // #33C3F0
const brandBlueLight = 'rgba(51, 195, 240, 0.1)';

const RevenueChart: React.FC = () => {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [8500, 9200, 10500, 11200, 12450, 9800],
        backgroundColor: brandBlueLight,
        borderColor: brandBlue,
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
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
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RevenueChart;
