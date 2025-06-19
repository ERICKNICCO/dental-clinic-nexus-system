
import { supabase } from '../../integrations/supabase/client';
import { Appointment } from '../../types/appointment';
import { appointmentTransformers } from './appointmentTransformers';
import { appointmentCrud } from './appointmentCrud';

export const appointmentSubscriptions = {
  // Subscribe to appointment changes with real-time updates
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('Setting up appointments subscription');
    
    const channel = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          console.log('Appointments change detected:', payload);
          
          // Fetch all appointments and update the callback
          try {
            const appointments = await appointmentCrud.getAll();
            callback(appointments);
          } catch (error) {
            console.error('Error fetching appointments after change:', error);
          }
        }
      )
      .subscribe();

    // Initial fetch
    appointmentCrud.getAll()
      .then(callback)
      .catch(error => console.error('Error in initial appointments fetch:', error));

    return () => {
      console.log('Unsubscribing from appointments changes');
      supabase.removeChannel(channel);
    };
  },

  // Row-level subscription for better performance
  subscribeToAppointmentsRowLevel(callback: (event: any) => void) {
    console.log('Setting up row-level appointments subscription');
    
    const channel = supabase
      .channel('appointments_row_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          console.log('Row-level appointment change:', payload);
          
          let transformedData = null;
          if (payload.new) {
            transformedData = appointmentTransformers.fromSupabase(payload.new);
          }
          
          const event = {
            type: payload.eventType,
            newRow: transformedData,
            oldRow: payload.old ? appointmentTransformers.fromSupabase(payload.old) : null
          };
          
          callback(event);
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from row-level appointments changes');
      supabase.removeChannel(channel);
    };
  }
};
