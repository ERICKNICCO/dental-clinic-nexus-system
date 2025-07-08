import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Calendar, Loader2, FileText } from 'lucide-react';
import { supabaseConsultationService } from '../../services/supabaseConsultationService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useSupabasePatients } from '../../hooks/useSupabasePatients';

const AdminTreatmentView: React.FC = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { patients } = useSupabasePatients();

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      setError(null);
      try {
        const all = await supabaseConsultationService.getAllConsultations();
        setConsultations(all);
      } catch (err: any) {
        setError('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  const pendingStatuses = ['in-progress', 'waiting-xray', 'xray-done'];
  const completedStatuses = ['completed'];

  const pendingConsultations = consultations.filter(c => pendingStatuses.includes(c.status));
  const completedConsultations = consultations.filter(c => completedStatuses.includes(c.status));
  const completedConsultationsByMonth = completedConsultations.filter(c => {
    if (!c.completedAt) return false;
    const d = new Date(c.completedAt);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === selectedMonth;
  });

  let displayedConsultations = consultations;
  if (activeTab === 'pending') displayedConsultations = pendingConsultations;
  else if (activeTab === 'completed') displayedConsultations = completedConsultationsByMonth;

  // Helper to get patient name from patientId
  const getPatientName = (patientId: string) => {
    const p = patients.find(p => p.patientId === patientId || p.id === patientId);
    return p ? p.name : patientId;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending ({pendingConsultations.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedConsultationsByMonth.length})</TabsTrigger>
              <TabsTrigger value="all">All ({consultations.length})</TabsTrigger>
            </TabsList>
            {activeTab === 'completed' && (
              <div className="mb-4 flex items-center gap-4">
                <Label htmlFor="month">Select Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-48"
                />
              </div>
            )}
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">Loading consultations...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <FileText className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600">{error}</p>
                </div>
              ) : displayedConsultations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No consultations found</h3>
                  <p className="text-sm">No consultations to display for this filter.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Diagnosis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedConsultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant={pendingStatuses.includes(c.status) ? 'secondary' : 'default'}>
                            {c.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPatientName(c.patientId)}</TableCell>
                        <TableCell>{c.doctorName}</TableCell>
                        <TableCell>{c.startedAt ? new Date(c.startedAt).toLocaleString() : '-'}</TableCell>
                        <TableCell>{c.completedAt ? new Date(c.completedAt).toLocaleString() : '-'}</TableCell>
                        <TableCell>{c.diagnosis || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTreatmentView;
