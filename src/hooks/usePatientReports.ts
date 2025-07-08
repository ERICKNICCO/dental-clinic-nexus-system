import { useEffect, useState } from 'react';
import { patientReportService } from '../services/patientReportService';

interface MonthlyPatientData {
  month: string;
  newPatients: number;
  returning: number;
}

export function usePatientReports() {
  const [monthlyPatientData, setMonthlyPatientData] = useState<MonthlyPatientData[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPatientsCount, setNewPatientsCount] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatientData() {
      setLoading(true);
      setError(null);
      const currentYear = new Date().getFullYear();

      try {
        const fetchedMonthlyData = await patientReportService.getMonthlyPatientData(currentYear);
        setMonthlyPatientData(fetchedMonthlyData);

        const fetchedTotalPatients = await patientReportService.getTotalPatients(currentYear);
        setTotalPatients(fetchedTotalPatients);

        const fetchedNewPatientsCount = await patientReportService.getNewPatientsCount(currentYear);
        setNewPatientsCount(fetchedNewPatientsCount);

        const fetchedRetentionRate = await patientReportService.getRetentionRate(currentYear);
        setRetentionRate(fetchedRetentionRate);

      } catch (err) {
        console.error('Error fetching patient reports:', err);
        setError('Failed to load patient data.');
      } finally {
        setLoading(false);
      }
    }

    fetchPatientData();
  }, []);

  return { monthlyPatientData, totalPatients, newPatientsCount, retentionRate, loading, error };
} 