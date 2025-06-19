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
  Timestamp, 
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment } from '../types/appointment';
import { notificationService } from './notificationService';
import { supabaseAppointmentService } from './supabaseAppointmentService';
import { supabaseNotificationService } from './supabaseNotificationService';

// Helper to send email notification for any status update
const sendAppointmentStatusEmail = async (
  appointment: Appointment,
  newStatus: string
) => {
  if (!appointment?.patient?.email && !appointment?.patient_email) {
    console.warn('[sendAppointmentStatusEmail] No patient email for appointment, skipping email notification');
    return;
  }

  let emailType:
    | 'confirmation'
    | 'approval'
    | 'reminder'
    | 'cancellation'
    | null = null;
  switch (newStatus) {
    case 'Confirmed':
      emailType = 'confirmation';
      break;
    case 'Approved':
      emailType = 'approval';
      break;
    case 'Completed':
      emailType = 'reminder'; // or another custom type if you wish
      break;
    case 'Cancelled':
      emailType = 'cancellation';
      break;
    default:
      emailType = null;
  }
  if (!emailType) {
    console.log('[sendAppointmentStatusEmail] No emailType matched for status:', newStatus);
    return;
  }

  try {
    // Use the **HARD-CODED** Supabase project URL for the edge function call
    const functionUrl = `https://ulknlrckbrwkxpakdrfn.supabase.co/functions/v1/send-appointment-email`;
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa25scmNrYnJ3a3hwYWtkcmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNDc1NDgsImV4cCI6MjA2NDgyMzU0OH0.U1uH3mNtoK8IM7xwc4ZZ8881ezXFWSPO7gTmkBew9xE";
    const payload = {
      appointmentId: appointment.id,
      recipientEmail: appointment.patient?.email || appointment.patient_email,
      patientName: appointment.patient?.name || appointment.patient_name,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      treatment: appointment.treatment,
      dentist: appointment.dentist,
      emailType,
    };

    console.log('[sendAppointmentStatusEmail] About to call edge function with:', payload);

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error(`[sendAppointmentStatusEmail] Edge function failed. Status: ${res.status}. Body: ${errorMsg}`);
    } else {
      const data = await res.json();
      console.log(`[sendAppointmentStatusEmail] Function response:`, data);
      console.log(
        `[sendAppointmentStatusEmail] Appointment status email (${emailType}) sent to`,
        appointment.patient?.email || appointment.patient_email
      );
    }
  } catch (err) {
    console.error(`[sendAppointmentStatusEmail] Failed to send ${emailType} email notification:`, err);
  }
};

// Send appointment confirmation email (alias for status email)
const sendAppointmentConfirmationEmail = async (
  appointment: Appointment
): Promise<boolean> => {
  try {
    if (!appointment || (!appointment.patient?.email && !appointment.patient_email)) {
      console.warn(
        'Cannot send confirmation email: Invalid or missing patient email'
      );
      return false;
    }

    // Call the status email sender, passing 'Confirmed'
    await sendAppointmentStatusEmail(appointment, 'Confirmed');

    console.log(
      'Confirmation email sent successfully for appointment:',
      appointment.id
    );
    return true;
  } catch (error) {
    console.error(
      'Error sending confirmation email for appointment:',
      appointment?.id,
      error
    );
    return false;
  }
};

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

  // Get appointments for a specific doctor with optional status filter
  async getAppointmentsForDoctor(doctorName: string, status?: string) {
    try {
      let q = query(
        collection(db, 'appointments'),
        where('dentist', '==', doctorName),
        orderBy('date', 'asc')
      );
      if (status) {
        q = query(q, where('status', '==', status));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.transformFirebaseData(doc.id, doc.data())) as Appointment[];
    } catch (error) {
      console.error('Error fetching appointments for doctor:', error);
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
    const patientEmail = data.email || data.patient?.email || data.patient_email || '';
    const patientName = data.name || data.patient?.name || data.patient_name || 'Unknown Patient';
    const patientPhone = data.phone || data.patient?.phone || data.patient_phone || 'No phone';
    
    // Try to get profile picture from email, fallback to placeholder
    let profileImage = '';
    if (patientEmail) {
      profileImage = this.getProfilePictureFromEmail(patientEmail);
    }
    
    // Define valid statuses to ensure type safety
    const validStatuses = ['Confirmed', 'Pending', 'Cancelled', 'Approved', 'Checked In', 'In Progress', 'Completed'];
    const appointmentStatus = validStatuses.includes(data.status as string) ? data.status as 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed' : 'Pending';

    return {
      id: docId, // Use the actual Firebase document ID as string
      date: data.date || '',
      time: data.time || '',
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_email: patientEmail,
      treatment: data.treatment || 'General Consultation',
      dentist: data.doctor || data.dentist || 'Unknown Doctor',
      status: appointmentStatus,
      notes: data.notes || '',
      // Legacy patient object for backward compatibility
      patient: {
        name: patientName,
        phone: patientPhone,
        image: profileImage,
        email: patientEmail,
        initials: this.getInitials(patientName)
      },
      patientId: data.patientId
    };
  },

  // Listen to real-time appointment updates with optional status filter
  subscribeToAppointments(callback: (appointments: Appointment[]) => void, doctorName?: string, status?: string) {
    let q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
    
    if (doctorName) {
      q = query(q, where('dentist', '==', doctorName));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }

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
      console.log("🔥🔥 [appointmentService] updateAppointment called!", { id, updates });
      const appointmentRef = doc(db, 'appointments', id.toString());
      
      // Get current appointment data before update
      const currentAppointmentSnap = await getDoc(appointmentRef);
      const currentAppointmentData = currentAppointmentSnap.exists() ? this.transformFirebaseData(currentAppointmentSnap.id, currentAppointmentSnap.data()) : undefined;

      // IMPORTANT: Get the intended newStatus
      const newStatus = updates.status;
      const statusChanged = newStatus && currentAppointmentData && currentAppointmentData.status !== newStatus;
      console.log('[updateAppointment] currentAppointmentData:', currentAppointmentData);
      console.log('[updateAppointment] newStatus:', newStatus);
      console.log('[updateAppointment] statusChanged:', statusChanged);

      // Create a new object to avoid modifying the original updates object
      const dataToUpdate: Partial<Appointment> = { ...updates };
      if (dataToUpdate.id) {
        delete dataToUpdate.id;
      }

      await updateDoc(appointmentRef, {
        ...dataToUpdate,
        updatedAt: Timestamp.now()
      });
      console.log('[updateAppointment] Successfully updated appointment:', id);

      // Always send status-change email (if patient has email)
      if (statusChanged && newStatus) {
        // Fetch latest appointment data for accurate details
        const updatedAppointmentSnap = await getDoc(appointmentRef);
        const updatedAppointmentData = updatedAppointmentSnap.exists() ? this.transformFirebaseData(updatedAppointmentSnap.id, updatedAppointmentSnap.data()) : undefined;
        console.log('[updateAppointment] Will trigger status-change email for:', updatedAppointmentData);
        if (
          updatedAppointmentData &&
          (updatedAppointmentData.patient?.email || updatedAppointmentData.patient_email)
        ) {
          await sendAppointmentStatusEmail(updatedAppointmentData, newStatus);
        } else {
          console.warn('[updateAppointment] No email found, cannot send status change email');
        }
      } else {
        console.log('[updateAppointment] Status did not change or newStatus missing, skipping email.');
      }
    } catch (error) {
      console.error('[updateAppointment] Error updating appointment:', error);
      throw error;
    }
  },

  // New function to approve an appointment
  async approveAppointment(appointmentId: string) {
    try {
      // Get the appointment details to trigger notification
      const appointmentDoc = await getDocs(query(collection(db, 'appointments'), where('id', '==', appointmentId)));
      let appointmentData: Appointment | undefined;
      if (!appointmentDoc.empty) {
        appointmentData = this.transformFirebaseData(appointmentDoc.docs[0].id, appointmentDoc.docs[0].data());
      }

      await this.updateAppointment(appointmentId, { status: 'Approved' });
      console.log('Appointment approved:', appointmentId);

      // Trigger notification for the doctor (if data is available and dentist exists)
      if (appointmentData && appointmentData.dentist) {
        await supabaseNotificationService.createNotification({
          type: 'appointment_approved',
          title: 'Appointment Approved',
          message: `Your appointment with ${appointmentData.patient_name || appointmentData.patient?.name} for ${new Date(appointmentData.date).toLocaleDateString()} at ${appointmentData.time} has been approved.`,
          appointment_id: appointmentData.id,
          target_doctor_name: appointmentData.dentist,
        });
        console.log(`Notification sent to doctor ${appointmentData.dentist} for approved appointment ${appointmentId}`);
      }

    } catch (error) {
      console.error('Error approving appointment:', error);
      throw error;
    }
  },

  // Check in patient
  async checkInPatient(appointmentId: string) {
    console.log('Checking in patient for appointment:', appointmentId);
    
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      await updateDoc(docRef, { 
        status: 'Checked In',
        updatedAt: new Date()
      });
      
      console.log('Patient checked in successfully');
      
      // Create notification for check-in
      try {
        await supabaseNotificationService.createNotification({
          type: 'patient_checkin',
          title: 'Patient Checked In',
          message: 'A patient has checked in and is ready for consultation',
          appointment_id: appointmentId,
        });
        console.log('Check-in notification created');
      } catch (notificationError) {
        console.error('Error creating check-in notification:', notificationError);
        // Don't throw here to avoid failing the check-in
      }
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
