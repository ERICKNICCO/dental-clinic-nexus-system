import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment } from '../types/appointment';

interface MonthlyPatientData {
  month: string;
  newPatients: number;
  returning: number;
}

export const patientReportService = {
  async getMonthlyPatientData(year: number): Promise<MonthlyPatientData[]> {
    const monthlyData: { [key: string]: { newPatients: number; returning: number } } = {};

    // Initialize data for all 12 months
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(year, i).toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = { newPatients: 0, returning: 0 };
    }

    try {
      const patientsRef = collection(db, 'patients');
      const appointmentsRef = collection(db, 'appointments');

      // Fetch all patients to determine new patients based on creation date
      const patientSnapshot = await getDocs(query(
        patientsRef,
        where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1))),
        where('createdAt', '<=', Timestamp.fromDate(new Date(year, 11, 31, 23, 59, 59))),
        orderBy('createdAt', 'asc')
      ));

      patientSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp)?.toDate();
        if (createdAt) {
          const month = createdAt.toLocaleString('default', { month: 'short' });
          if (monthlyData[month]) {
            monthlyData[month].newPatients += 1;
          }
        }
      });

      // Fetch all appointments to determine returning patients
      const appointmentSnapshot = await getDocs(query(
        appointmentsRef,
        where('date', '>=', `${year}-01-01`),
        where('date', '<=', `${year}-12-31`),
        orderBy('date', 'asc')
      ));

      const patientAppointmentCounts: { [patientId: string]: number } = {};
      appointmentSnapshot.forEach(doc => {
        const data = doc.data() as Appointment;
        // Assuming patientId exists in appointment data
        if (data.patientId) {
          patientAppointmentCounts[data.patientId] = (patientAppointmentCounts[data.patientId] || 0) + 1;
        }
      });

      // Count returning patients (those with more than one appointment in the year)
      // This is a simplified logic, a more robust solution might involve checking across all time
      Object.keys(patientAppointmentCounts).forEach(patientId => {
        if (patientAppointmentCounts[patientId] > 1) {
          // For simplicity, attributing returning patients to the month of their latest appointment
          // A more accurate approach would be to track their first appointment each year
          const latestAppointment = appointmentSnapshot.docs.find(d => (d.data() as Appointment).patientId === patientId);
          if (latestAppointment) {
            const latestDate = new Date(latestAppointment.data().date);
            const month = latestDate.toLocaleString('default', { month: 'short' });
            if (monthlyData[month]) {
              monthlyData[month].returning += 1;
            }
          }
        }
      });

      // Convert to array in correct month order
      const orderedMonths = Array.from({ length: 12 }, (_, i) => new Date(year, i).toLocaleString('default', { month: 'short' }));
      return orderedMonths.map(month => ({
        month,
        newPatients: monthlyData[month].newPatients,
        returning: monthlyData[month].returning,
      }));

    } catch (error) {
      console.error('Error fetching monthly patient data:', error);
      throw error;
    }
  },

  async getTotalPatients(year: number): Promise<number> {
    try {
      const patientSnapshot = await getDocs(collection(db, 'patients'));
      return patientSnapshot.size;
    } catch (error) {
      console.error('Error fetching total patients:', error);
      throw error;
    }
  },

  async getNewPatientsCount(year: number): Promise<number> {
    try {
      const monthlyData = await this.getMonthlyPatientData(year);
      return monthlyData.reduce((sum, item) => sum + item.newPatients, 0);
    } catch (error) {
      console.error('Error calculating new patients count:', error);
      throw error;
    }
  },

  async getRetentionRate(year: number): Promise<number> {
    try {
      const monthlyData = await this.getMonthlyPatientData(year);
      const totalNewPatients = monthlyData.reduce((sum, item) => sum + item.newPatients, 0);
      const totalReturningPatients = monthlyData.reduce((sum, item) => sum + item.returning, 0);

      if (totalNewPatients === 0) return 0; // Avoid division by zero

      // Simplified retention rate: (Returning Patients / Total Patients) - this needs a more robust calculation
      // For a more accurate retention rate, you'd track specific cohorts over time.
      const totalPatients = await this.getTotalPatients(year);
      return (totalReturningPatients / totalPatients) * 100;
    } catch (error) {
      console.error('Error calculating retention rate:', error);
      throw error;
    }
  }
}; 