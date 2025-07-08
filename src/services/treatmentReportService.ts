import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment } from '../types/appointment';

interface TreatmentDistributionData {
  name: string;
  value: number;
}

export const treatmentReportService = {
  async getTreatmentDistribution(): Promise<TreatmentDistributionData[]> {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const querySnapshot = await getDocs(appointmentsRef);

      const treatmentCounts: { [key: string]: number } = {};

      querySnapshot.forEach(doc => {
        const appointment = doc.data() as Appointment;
        const treatmentName = appointment.treatment || 'Unknown Treatment';
        treatmentCounts[treatmentName] = (treatmentCounts[treatmentName] || 0) + 1;
      });

      return Object.keys(treatmentCounts).map(name => ({
        name,
        value: treatmentCounts[name],
      }));

    } catch (error) {
      console.error('Error fetching treatment distribution:', error);
      throw error;
    }
  }
}; 