
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
  
  console.log('🔍 Doctor name matching:', {
    appointment: appointmentDoctor,
    normalized_appointment: normalizedAppointmentDoctor,
    user: userDoctor,
    normalized_user: normalizedUserDoctor
  });
  
  // Exact match after normalization
  if (normalizedAppointmentDoctor === normalizedUserDoctor) {
    console.log('✅ Exact match found');
    return true;
  }
  
  // Split both names into words for better matching
  const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
  const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
  
  console.log('🔍 Words comparison:', {
    appointmentWords,
    userWords
  });
  
  // Check if any word from appointment doctor matches any word from user doctor
  for (const appointmentWord of appointmentWords) {
    for (const userWord of userWords) {
      if (appointmentWord === userWord && appointmentWord.length > 2) { // Only match meaningful words
        console.log('✅ Word match found:', appointmentWord);
        return true;
      }
    }
  }
  
  // Special case: Check if the appointment doctor name is contained within the user doctor name
  // This handles cases like "Dr. Israel" matching "Dr. Israel Kombole"
  if (normalizedUserDoctor.includes(normalizedAppointmentDoctor) && normalizedAppointmentDoctor.length > 2) {
    console.log('✅ Appointment doctor name contained in user doctor name');
    return true;
  }
  
  // Check if appointment doctor contains any significant user word
  for (const userWord of userWords) {
    if (userWord.length > 2 && normalizedAppointmentDoctor.includes(userWord)) {
      console.log('✅ User word found in appointment doctor:', userWord);
      return true;
    }
  }
  
  console.log('❌ No match found');
  return false;
};

// Get today's date string in YYYY-MM-DD format
export const getTodayString = (): string => {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
};
