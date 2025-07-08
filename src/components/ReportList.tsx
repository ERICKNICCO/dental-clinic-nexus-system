import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from "@/components/ui/chart";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FileText, Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { useFinancialReports } from '../hooks/useFinancialReports';
import { usePatientReports } from '../hooks/usePatientReports';
import { useTreatmentReports } from '../hooks/useTreatmentReports';

// Brand colors
const brandBlue = '#33C3F0'; // Sky Blue
const brandBrightBlue = '#1EAEDB'; // Bright Blue
const brandGreen = '#4AD295'; // Green from logo
const brandLightGreen = '#F2FCE2'; // Soft Green

// Colors for pie chart - using brand colors
const COLORS = [brandBlue, brandGreen, brandBrightBlue, '#60D5FA', '#8BDC70'];

const ReportList = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { monthlyData: financeMonthlyData, totalRevenue, loading: financialLoading, error: financialError } = useFinancialReports();
  const { monthlyPatientData, totalPatients, newPatientsCount, retentionRate, loading: patientLoading, error: patientError } = usePatientReports();
  const { treatmentDistribution, loading: treatmentLoading, error: treatmentError } = useTreatmentReports();

  const currentYear = date?.getFullYear() || new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">Reports Dashboard</h2>
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {date?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Button>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial" className="w-full">
          <div className="flex flex-wrap gap-6 mt-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center w-full sm:w-96 border border-blue-100">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6a2 2 0 012-2h2.586A2 2 0 0110 4.586l1.414 1.414A2 2 0 0114 6h2a2 2 0 012 2v8c0 2.21-3.582 4-8 4z" /></svg>
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2 tracking-wide">Total Revenue</div>
              <div className="text-4xl font-extrabold text-blue-700 mb-1">
                {financialLoading ? <Loader2 className="h-8 w-8 animate-spin text-gray-400" /> : `Tsh ${totalRevenue.toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-400">All time revenue generated</div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients ({currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {patientLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <div className="text-2xl font-bold">{totalPatients.toLocaleString()}</div>}
                {/* <p className="text-xs text-green-600 mt-1">↑ 8.3% from last period</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Patients ({currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {patientLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <div className="text-2xl font-bold">{newPatientsCount.toLocaleString()}</div>}
                {/* <p className="text-xs text-green-600 mt-1">↑ 12.7% from last period</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate ({currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {patientLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <div className="text-2xl font-bold">{retentionRate.toFixed(1)}%</div>}
                {/* <p className="text-xs text-green-600 mt-1">↑ 2.1% from last period</p> */}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient Visits ({currentYear})</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              {patientLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
              ) : patientError ? (
                <div className="text-center text-red-500">Error: {patientError}</div>
              ) : monthlyPatientData.length === 0 ? (
                <div className="text-center text-gray-500">No patient data available for {currentYear}.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPatientData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newPatients" stroke={brandBlue} name="New Patients" />
                    <Line type="monotone" dataKey="returning" stroke={brandGreen} name="Returning Patients" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treatments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Distribution ({currentYear})</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {treatmentLoading ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                ) : treatmentError ? (
                  <div className="text-center text-red-500">Error: {treatmentError}</div>
                ) : treatmentDistribution.length === 0 ? (
                  <div className="text-center text-gray-500">No treatment data available for {currentYear}.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={treatmentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {treatmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Treatment Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Monthly Treatment Summary', 'Treatment Success Rate', 'Material Usage Report', 'Treatment Duration Analysis'].map((report, index) => (
                    <div key={index} className="flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <h4 className="font-medium">{report}</h4>
                        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportList;
