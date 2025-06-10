
import React from 'react';
import StatsCard from './dashboard/StatsCard';
import AppointmentCalendar from './dashboard/Calendar';
import AppointmentsTable from './dashboard/AppointmentsTable';
import RevenueChart from './dashboard/RevenueChart';
import RecentPatients from './dashboard/RecentPatients';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorStats } from '../hooks/useDoctorStats';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { stats, loading } = useDoctorStats(userProfile?.name || '');

  const isDoctor = userProfile?.role === 'doctor';

  // Get current month name for display
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gray-100 w-full">
      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isDoctor ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 mb-6`}>
        <StatsCard 
          title={isDoctor ? `${currentMonthName} Confirmed Appointments` : "Today's Appointments"}
          value={loading ? "..." : isDoctor ? stats.monthlyAppointments : stats.monthlyAppointments}
          icon="calendar" 
          color="bg-blue-100 text-blue-600" 
        />
        <StatsCard 
          title={isDoctor ? "My Total Patients" : "Total Patients"}
          value={loading ? "..." : stats.totalPatients}
          icon="user" 
          color="bg-green-100 text-green-600" 
        />
        {!isDoctor && (
          <StatsCard 
            title="Monthly Revenue" 
            value="$12,450" 
            icon="dollar" 
            color="bg-yellow-100 text-yellow-600" 
          />
        )}
        <StatsCard 
          title={isDoctor ? "My Pending Treatments" : "Pending Treatments"}
          value={loading ? "..." : stats.pendingTreatments}
          icon="tooth" 
          color="bg-red-100 text-red-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <AppointmentCalendar />
        </div>

        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <AppointmentsTable />
        </div>
      </div>

      {/* Charts and Recent Patients - Hide revenue chart for doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Only show for admin/staff */}
        {!isDoctor && (
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
        )}

        {/* Recent Patients */}
        <div className={isDoctor ? "lg:col-span-3" : "lg:col-span-1"}>
          <RecentPatients />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
