
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
import { FileText, Download, Calendar as CalendarIcon } from 'lucide-react';

// Brand colors
const brandBlue = '#33C3F0'; // Sky Blue
const brandBrightBlue = '#1EAEDB'; // Bright Blue
const brandGreen = '#4AD295'; // Green from logo
const brandLightGreen = '#F2FCE2'; // Soft Green

// Mock financial data
const financeData = [
  { month: 'Jan', revenue: 42500, expenses: 29800 },
  { month: 'Feb', revenue: 38700, expenses: 26500 },
  { month: 'Mar', revenue: 47200, expenses: 31200 },
  { month: 'Apr', revenue: 41000, expenses: 30000 },
  { month: 'May', revenue: 52300, expenses: 34500 },
  { month: 'Jun', revenue: 49800, expenses: 32100 }
];

// Mock patient data
const patientData = [
  { month: 'Jan', newPatients: 24, returning: 58 },
  { month: 'Feb', newPatients: 18, returning: 52 },
  { month: 'Mar', newPatients: 29, returning: 61 },
  { month: 'Apr', newPatients: 22, returning: 54 },
  { month: 'May', newPatients: 31, returning: 65 },
  { month: 'Jun', newPatients: 26, returning: 63 }
];

// Mock treatment data
const treatmentData = [
  { name: 'Routine Checkup', value: 35 },
  { name: 'Fillings', value: 25 },
  { name: 'Root Canal', value: 15 },
  { name: 'Cosmetic Procedures', value: 10 },
  { name: 'Orthodontics', value: 15 }
];

// Colors for pie chart - using brand colors
const COLORS = [brandBlue, brandGreen, brandBrightBlue, '#60D5FA', '#8BDC70'];

const ReportList = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

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
        
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$271,500</div>
                <p className="text-xs text-green-600 mt-1">↑ 12.5% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$184,100</div>
                <p className="text-xs text-green-600 mt-1">↓ 3.2% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$87,400</div>
                <p className="text-xs text-green-600 mt-1">↑ 18.7% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill={brandBlue} name="Revenue" />
                  <Bar dataKey="expenses" fill={brandGreen} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">503</div>
                <p className="text-xs text-green-600 mt-1">↑ 8.3% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">150</div>
                <p className="text-xs text-green-600 mt-1">↑ 12.7% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86%</div>
                <p className="text-xs text-green-600 mt-1">↑ 2.1% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient Visits</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newPatients" stroke={brandBlue} name="New Patients" />
                  <Line type="monotone" dataKey="returning" stroke={brandGreen} name="Returning Patients" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treatments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {treatmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
