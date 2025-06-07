
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment } from '../types/appointment';

export const appointmentService = {
  // Add a new appointment
  async addAppointment(appointmentData: Omit<Appointment, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  },

  // Get all appointments
  async getAppointments() {
    try {
      const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.transformFirebaseData(doc.id, doc.data())) as Appointment[];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Generate profile picture URL from email using Gravatar
  getProfilePictureFromEmail(email: string): string {
    if (!email) return '';
    
    // Simple hash function for Gravatar (you might want to use a proper MD5 hash)
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${btoa(hash)}?d=404&s=80`;
  },

  // Get initials from name for avatar fallback
  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Transform Firebase data to match our Appointment interface
  transformFirebaseData(docId: string, data: any): Appointment {
    const patientEmail = data.email || data.patient?.email || '';
    const patientName = data.name || data.patient?.name || 'Unknown Patient';
    
    // Try to get profile picture from email, fallback to placeholder
    let profileImage = '';
    if (patientEmail) {
      profileImage = this.getProfilePictureFromEmail(patientEmail);
    }
    
    return {
      id: docId, // Use the actual Firebase document ID as string
      date: data.date || '',
      time: data.time || '',
      patient: {
        name: patientName,
        phone: data.phone || data.patient?.phone || 'No phone',
        image: profileImage,
        email: patientEmail,
        initials: this.getInitials(patientName)
      },
      treatment: data.treatment || 'General Consultation',
      dentist: data.doctor || data.dentist || 'Unknown Doctor',
      status: data.status || 'Pending',
      patientId: data.patientId
    };
  },

  // Listen to real-time appointment updates
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
      const appointments = querySnapshot.docs.map(doc => 
        this.transformFirebaseData(doc.id, doc.data())
      ) as Appointment[];
      callback(appointments);
    });
  },

  // Update an appointment
  async updateAppointment(id: string | number, updates: Partial<Appointment>) {
    try {
      const appointmentRef = doc(db, 'appointments', id.toString());
      // Remove the id from updates to avoid updating the document ID
      const { id: _, ...updateData } = updates as any;
      
      await updateDoc(appointmentRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
      console.log('Successfully updated appointment:', id);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  // Check in a patient for their appointment
  async checkInPatient(appointmentId: string | number) {
    try {
      await this.updateAppointment(appointmentId, { status: 'Checked In' });
      console.log('Patient checked in for appointment:', appointmentId);
    } catch (error) {
      console.error('Error checking in patient:', error);
      throw error;
    }
  },

  // Start consultation from appointment
  async startConsultationFromAppointment(appointmentId: string | number) {
    try {
      await this.updateAppointment(appointmentId, { status: 'In Progress' });
      console.log('Started consultation for appointment:', appointmentId);
    } catch (error) {
      console.error('Error starting consultation from appointment:', error);
      throw error;
    }
  },

  // Complete appointment
  async completeAppointment(appointmentId: string | number) {
    try {
      await this.updateAppointment(appointmentId, { status: 'Completed' });
      console.log('Completed appointment:', appointmentId);
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  },

  // Get appointments for a specific doctor that are checked in
  async getCheckedInAppointmentsForDoctor(doctorName: string) {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('doctor', '==', doctorName),
        where('status', '==', 'Checked In'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.transformFirebaseData(doc.id, doc.data())) as Appointment[];
    } catch (error) {
      console.error('Error fetching checked in appointments:', error);
      throw error;
    }
  },

  // Delete an appointment
  async deleteAppointment(id: string | number) {
    try {
      await deleteDoc(doc(db, 'appointments', id.toString()));
      console.log('Successfully deleted appointment:', id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Get appointments by doctor
  async getAppointmentsByDoctor(doctorName: string) {
    try {
      const q = query(
        collection(db, 'appointments'), 
        where('doctor', '==', doctorName),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.transformFirebaseData(doc.id, doc.data())) as Appointment[];
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      throw error;
    }
  }
};
