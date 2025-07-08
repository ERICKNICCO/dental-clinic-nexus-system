import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, Users, DollarSign, Activity } from 'lucide-react';
import { useDoctorStats } from '../../hooks/useDoctorStats';
import { useFinancialReports } from '../../hooks/useFinancialReports';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';

const DashboardStats = () => {
  const { userProfile } = useAuth();
  // Dummy state to force update
  const [forceUpdate, setForceUpdate] = useState(0);
  // Subscribe to changes in relevant tables
  useEffect(() => {
    const channels = [
      supabase.channel('dashboard-appointments').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => setForceUpdate(f => f + 1)).subscribe(),
      supabase.channel('dashboard-patients').on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => setForceUpdate(f => f + 1)).subscribe(),
      supabase.channel('dashboard-payments').on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => setForceUpdate(f => f + 1)).subscribe(),
      supabase.channel('dashboard-consultations').on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () => setForceUpdate(f => f + 1)).subscribe(),
    ];
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, []);
  // Pass forceUpdate as a dependency to hooks to force re-run
  const { stats, loading } = useDoctorStats(userProfile?.name || '', userProfile?.role, forceUpdate);
  const { totalRevenue, loading: financialLoading } = useFinancialReports(forceUpdate);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {userProfile?.role === 'doctor' ? "This Month's Appointments" : "Today's Appointments"}
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.monthlyAppointments}</div>
          <p className="text-xs text-muted-foreground">
            {userProfile?.role === 'doctor' ? "Confirmed this month" : "Scheduled for today"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPatients}</div>
          <p className="text-xs text-muted-foreground">Registered patients</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {financialLoading ? 'Loading...' : `Tsh ${totalRevenue.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Treatments</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingTreatments}</div>
          <p className="text-xs text-muted-foreground">Awaiting completion</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
