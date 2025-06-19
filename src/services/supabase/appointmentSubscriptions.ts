
import { supabase } from '../../integrations/supabase/client';
import { Appointment } from '../../types/appointment';
import { appointmentTransformers } from './appointmentTransformers';
import { appointmentCrud } from './appointmentCrud';

export const appointmentSubscriptions = {
  // Subscribe to appointment changes with real-time updates using unique channel names
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('Setting up appointments subscription with enhanced real-time');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const channelName = `appointments_enhanced_${timestamp}_${randomId}`;
    
    let isSubscribed = true;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          if (!isSubscribed) return;
          
          console.log('Enhanced real-time appointment change detected:', payload);
          
          // Fetch all appointments and update the callback
          try {
            const appointments = await appointmentCrud.getAll();
            console.log('Fetched appointments after enhanced real-time change:', appointments);
            callback(appointments);
          } catch (error) {
            console.error('Error fetching appointments after enhanced real-time change:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Enhanced appointment subscription status:', status);
      });

    // Initial fetch
    appointmentCrud.getAll()
      .then((appointments) => {
        if (isSubscribed) {
          callback(appointments);
        }
      })
      .catch(error => {
        if (isSubscribed) {
          console.error('Error in initial enhanced appointments fetch:', error);
        }
      });

    return () => {
      console.log('Unsubscribing from enhanced appointments changes');
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  },

  // Row-level subscription for better performance with unique channel names
  subscribeToAppointmentsRowLevel(callback: (event: any) => void) {
    console.log('Setting up enhanced row-level appointments subscription');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const channelName = `appointments_row_enhanced_${timestamp}_${randomId}`;
    
    let isSubscribed = true;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          if (!isSubscribed) return;
          
          console.log('Enhanced row-level appointment change:', payload);
          
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
      .subscribe((status) => {
        console.log('Enhanced row-level subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from enhanced row-level appointments changes');
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }
};
