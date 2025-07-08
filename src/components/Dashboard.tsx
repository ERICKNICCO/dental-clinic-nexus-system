import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from './dashboard/StatsCard';
import AppointmentCalendar from './dashboard/Calendar';
import AppointmentsTable from './dashboard/AppointmentsTable';
import RevenueChart from './dashboard/RevenueChart';
import RecentPatients from './dashboard/RecentPatients';
import { useDoctorStats } from '../hooks/useDoctorStats';
import { useFinancialReports } from '../hooks/useFinancialReports';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { Appointment } from '../types/appointment';
import type { Patient } from '../types/appointment';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Always call hooks at the top level
  const { stats, loading } = useDoctorStats(userProfile?.name || '', userProfile?.role);
  const { totalRevenue, loading: financialLoading } = useFinancialReports();
  const { patients, loading: patientsLoading } = usePatients();
  const { appointments, loading: appointmentsLoading } = useAppointments();

  const isRadiologist = userProfile?.role === 'radiologist';

  if (isRadiologist) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-gray-100 w-full flex flex-col items-center justify-center min-h-[65vh]">
        <div className="bg-white rounded-lg shadow p-10 w-full max-w-xl flex flex-col items-center">
          <div className="mb-4 flex items-center gap-3">
            <Scan size={40} className="text-blue-500" />
            <h2 className="text-2xl font-bold text-blue-700">Hello, {userProfile?.name || "Radiologist"}!</h2>
          </div>
          <p className="mb-6 text-gray-600 text-center">
            Welcome to your radiology dashboard.<br/>
            From here, you can quickly jump to the X-ray Room to process your studies.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 text-lg rounded mb-6"
            onClick={() => navigate("/xray-room")}
          >
            <Scan className="mr-2" />
            Enter X-ray Room
          </Button>
          <div className="w-full mt-6">
            <div className="text-center text-xs text-blue-500 p-4 border-t">
              Recent activity will appear here soon.
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isDoctor = userProfile?.role === 'doctor';

  // Get current month name for display
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // Helper function to check if appointment date is today (same as in AppointmentsTable)
  const isAppointmentToday = (appointmentDate: string) => {
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    const appointmentDateObj = new Date(appointmentDate);
    const appointmentString = appointmentDateObj.getFullYear() + '-' + 
      String(appointmentDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
      String(appointmentDateObj.getDate()).padStart(2, '0');
    
    return appointmentString === todayString;
  };

  // Helper function to normalize doctor names for comparison (same as in AppointmentsTable)
  const normalizeDoctorName = (name: string) => {
    if (!name) return '';
    
    return name.toLowerCase()
      .replace(/^dr\.?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper function to check if two doctor names match (same as in AppointmentsTable)
  const isDoctorNameMatch = (appointmentDoctor: string, userDoctor: string) => {
    const normalizedAppointmentDoctor = normalizeDoctorName(appointmentDoctor);
    const normalizedUserDoctor = normalizeDoctorName(userDoctor);
    
    if (normalizedAppointmentDoctor === normalizedUserDoctor) {
      return true;
    }
    
    const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
    const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
    
    for (const appointmentWord of appointmentWords) {
      for (const userWord of userWords) {
        if (appointmentWord === userWord) {
          return true;
        }
      }
    }
    
    for (const appointmentWord of appointmentWords) {
      if (normalizedUserDoctor.includes(appointmentWord)) {
        return true;
      }
    }
    
    for (const userWord of userWords) {
      if (normalizedAppointmentDoctor.includes(userWord)) {
        return true;
      }
    }
    
    return false;
  };

  // Calculate today's appointments using the same logic as AppointmentsTable
  const todaysAppointmentsCount = appointments.filter(appointment => {
    const isToday = isAppointmentToday(appointment.date);
    
    if (userProfile?.role === 'doctor') {
      const appointmentDoctor = appointment.dentist || '';
      const userDoctor = userProfile.name || '';
      const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
      return isToday && isDoctorMatch;
    }
    
    return isToday;
  }).length;

  const upcomingAppointments = appointments
    .filter((appt: Appointment) => new Date(appt.date) > new Date() && appt.status === 'Approved')
    .sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gray-100 w-full">
      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isDoctor ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 mb-6`}>
        <StatsCard 
          title={isDoctor ? `${currentMonthName} Confirmed Appointments` : "Today's Appointments"}
          value={loading || appointmentsLoading ? "..." : isDoctor ? stats.monthlyAppointments : todaysAppointmentsCount}
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
            title="Total Revenue" 
            value={financialLoading ? 'Loading...' : `Tsh ${totalRevenue.toLocaleString()}`}
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
