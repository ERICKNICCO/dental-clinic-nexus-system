
import React, { useMemo } from 'react';
import StatsCard from './dashboard/StatsCard';
import Calendar from './dashboard/Calendar';
import AppointmentsTable from './dashboard/AppointmentsTable';
import RecentPatients from './dashboard/RecentPatients';
import RevenueChart from './dashboard/RevenueChart';
import { useAppointments } from '../hooks/useAppointments';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Users, DollarSign, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { appointments, loading } = useAppointments();
  const { userProfile } = useAuth();

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Calculate today's appointments count
  const todaysAppointmentsCount = useMemo(() => {
    return appointments.filter(appointment => 
      appointment.date === today && 
      (appointment.status === 'Confirmed' || appointment.status === 'Approved')
    ).length;
  }, [appointments, today]);

  // Calculate total patients (unique patients from all appointments)
  const totalPatients = useMemo(() => {
    const uniquePatients = new Set(
      appointments
        .filter(appointment => appointment.status === 'Confirmed' || appointment.status === 'Approved')
        .map(appointment => appointment.patient.name)
    );
    return uniquePatients.size;
  }, [appointments]);

  // Calculate pending treatments (appointments with Pending status)
  const pendingTreatments = useMemo(() => {
    return appointments.filter(appointment => appointment.status === 'Pending').length;
  }, [appointments]);

  const getDashboardTitle = () => {
    if (userProfile?.role === 'doctor') {
      return `Welcome back, ${userProfile.name}`;
    }
    return 'Dashboard Overview';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-600"></div>
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900">{getDashboardTitle()}</h2>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Appointments"
          value={todaysAppointmentsCount}
          icon={CalendarIcon}
          color="blue"
        />
        <StatsCard
          title="Total Patients"
          value={totalPatients}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value="Tsh 0"
          icon={DollarSign}
          color="yellow"
        />
        <StatsCard
          title="Pending Treatments"
          value={pendingTreatments}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar and Today's Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <Calendar />
          <AppointmentsTable />
        </div>

        {/* Right Column - Charts and Recent Patients */}
        <div className="space-y-6">
          <RevenueChart />
          <RecentPatients />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
