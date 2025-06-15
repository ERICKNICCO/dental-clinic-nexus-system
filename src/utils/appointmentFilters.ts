
// Shared utility functions for filtering appointments

// Helper function to check if appointment date is today
export const isAppointmentToday = (appointmentDate: string): boolean => {
  const today = new Date();
  const todayString = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
  
  const appointmentDateObj = new Date(appointmentDate);
  const appointmentString = appointmentDateObj.getFullYear() + '-' + 
    String(appointmentDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
    String(appointmentDateObj.getDate()).padStart(2, '0');
  
  return appointmentString === todayString;
};

// Helper function to normalize doctor names for comparison
export const normalizeDoctorName = (name: string): string => {
  if (!name) return '';
  
  return name.toLowerCase()
    .replace(/^dr\.?\s*/i, '') // Remove "Dr." or "Dr" prefix
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Helper function to check if two doctor names match
export const isDoctorNameMatch = (appointmentDoctor: string, userDoctor: string): boolean => {
  const normalizedAppointmentDoctor = normalizeDoctorName(appointmentDoctor);
  const normalizedUserDoctor = normalizeDoctorName(userDoctor);
  
  // Exact match
  if (normalizedAppointmentDoctor === normalizedUserDoctor) {
    return true;
  }
  
  // Split both names into words for better matching
  const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
  const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
  
  // Check if any word from appointment doctor matches any word from user doctor
  for (const appointmentWord of appointmentWords) {
    for (const userWord of userWords) {
      if (appointmentWord === userWord) {
        return true;
      }
    }
  }
  
  // Check if appointment doctor contains any user word or vice versa
  for (const appointmentWord of appointmentWords) {
    if (normalizedUserDoctor.includes(appointmentWord)) {
      return true;
    }
  }
  
  for (const userWord of userWords) {
    if (normalizedAppointmentDoctor.includes(userWord)) {
      return true;
    }
  }
  
  return false;
};

// Get today's date string in YYYY-MM-DD format
export const getTodayString = (): string => {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
};
