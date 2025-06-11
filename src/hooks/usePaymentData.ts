
import { useState, useEffect } from 'react';
import { useAllTreatmentNotes } from './useAllTreatmentNotes';
import { usePatients } from './usePatients';
import { treatmentPricingFirebaseService } from '../services/treatmentPricingFirebaseService';

interface Payment {
  id: string;
  patientName: string;
  treatmentName: string;
  amount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paymentMethod: string;
  insuranceProvider?: string;
  date: string;
  notes: string;
}

export const usePaymentData = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatmentPricing, setTreatmentPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  const { allNotes, loading: notesLoading } = useAllTreatmentNotes();
  const { patients, loading: patientsLoading } = usePatients();

  // Load treatment pricing from Firebase
  useEffect(() => {
    const loadTreatmentPricing = async () => {
      try {
        setPricingLoading(true);
        const pricing = await treatmentPricingFirebaseService.getAllTreatmentPricing();
        setTreatmentPricing(pricing);
      } catch (error) {
        console.error('Error loading treatment pricing:', error);
      } finally {
        setPricingLoading(false);
      }
    };

    loadTreatmentPricing();
  }, []);

  // Helper function to find treatment price
  const findTreatmentPrice = (procedureName: string) => {
    // Try exact match first
    let pricingData = treatmentPricing.find(p => p.name === procedureName);
    if (pricingData) {
      return pricingData.price;
    }
    
    pricingData = treatmentPricing.find(p => p.name.toLowerCase() === procedureName.toLowerCase());
    if (pricingData) {
      return pricingData.price;
    }
    
    pricingData = treatmentPricing.find(p => 
      p.name.toLowerCase().includes(procedureName.toLowerCase()) ||
      procedureName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (pricingData) {
      return pricingData.price;
    }
    
    return 0;
  };

  // Helper function to find patient info by ID or name
  const findPatientInfo = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId || p.name === patientId);
    return patient ? {
      name: patient.name,
      insuranceProvider: patient.insurance,
      patientType: patient.patientType
    } : {
      name: 'Unknown Patient',
      insuranceProvider: 'NHIF',
      patientType: 'insurance'
    };
  };

  // Convert treatment notes to payments
  useEffect(() => {
    if (!notesLoading && !patientsLoading && !pricingLoading) {
      const paymentsFromTreatments = allNotes.map(note => {
        const amount = findTreatmentPrice(note.procedure);
        const patientInfo = findPatientInfo(note.patientId);
        
        // Determine payment method based on patient type and insurance
        let paymentMethod = '';
        let insuranceProvider = '';
        
        if (patientInfo.patientType === 'insurance') {
          insuranceProvider = patientInfo.insuranceProvider || 'NHIF';
          paymentMethod = insuranceProvider;
        } else {
          paymentMethod = 'Cash';
        }
        
        // For demo purposes, randomly assign payment status
        const statuses: ('paid' | 'partial' | 'pending')[] = ['paid', 'partial', 'pending'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        let amountPaid = 0;
        if (randomStatus === 'paid') {
          amountPaid = amount;
        } else if (randomStatus === 'partial') {
          amountPaid = Math.floor(amount * 0.5); // 50% paid
        }

        return {
          id: note.id,
          patientName: patientInfo.name,
          treatmentName: note.procedure,
          amount: amount,
          amountPaid: amountPaid,
          paymentStatus: randomStatus,
          paymentMethod: paymentMethod,
          insuranceProvider: insuranceProvider,
          date: note.date,
          notes: note.notes || 'Treatment completed'
        };
      });

      setPayments(paymentsFromTreatments);
    }
  }, [allNotes, patients, treatmentPricing, notesLoading, patientsLoading, pricingLoading]);

  return {
    payments,
    loading: notesLoading || patientsLoading || pricingLoading
  };
};
