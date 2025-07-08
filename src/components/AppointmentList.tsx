import React, { useState } from 'react';
import AppointmentModal from './dashboard/AppointmentModal';
import AppointmentFilters from './appointments/AppointmentFilters';
import AppointmentTable from './appointments/AppointmentTable';
import { Appointment } from '../types/appointment';
import { filterAppointments } from './appointments/appointmentUtils';
import { useAppointments } from '../hooks/useAppointments';
import { useToast } from '../hooks/use-toast';
import { emailNotificationService } from '../services/emailNotificationService';
import { useAuth } from '../contexts/AuthContext';

const AppointmentList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const { appointments, loading, error, updateAppointment, deleteAppointment, refreshAppointments } = useAppointments();
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Filter appointments based on search term and status filter
  const filteredAppointments = filterAppointments(appointments, searchTerm, statusFilter);

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleApproveAppointment = async (id: string) => {
    try {
      const result = await updateAppointment(id, { status: 'Approved' });
      if (result.success) {
        toast({
          title: "Success",
          description: "Appointment approved successfully",
        });
        
        // Show warnings for notification failures
        if (result.notificationError) {
          toast({
            title: "Warning",
            description: `Appointment approved but notification failed: ${result.notificationError}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve appointment",
        variant: "destructive",
      });
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      const result = await updateAppointment(id, { status: 'Confirmed' });
      if (result.success) {
        toast({
          title: "Success",
          description: "Appointment confirmed successfully",
        });
        
        // Show warnings for email failures
        if (result.emailError) {
          toast({
            title: "Warning",
            description: `Appointment confirmed but email failed: ${result.emailError}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm appointment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast({
        title: 'Success',
        description: 'Appointment deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete appointment',
        variant: 'destructive',
      });
    }
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-600"></div>
          <span className="ml-2">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Error loading appointments: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <AppointmentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onNewAppointment={handleNewAppointment}
        />
        
        <AppointmentTable
          appointments={filteredAppointments}
          onEditAppointment={handleEditClick}
          onApproveAppointment={handleApproveAppointment}
          onConfirmAppointment={handleConfirmAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      </div>
      
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={async () => {
          await refreshAppointments();
          setIsModalOpen(false);
        }} 
        appointment={selectedAppointment} 
      />
    </>
  );
};

export default AppointmentList;
