import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import DigitalSignaturePad from '../insurance/DigitalSignaturePad';
import { Payment } from '../../services/paymentService';
import { supabasePatientService } from '../../services/supabasePatientService';
import { Patient } from '../../types/patient';
import { supabaseConsultationService } from '../../services/supabaseConsultationService';
import { Consultation } from '../../types/consultation';
import { useReactToPrint } from 'react-to-print';
import { insuranceClaimService } from '../../services/insuranceClaimService';
import { paymentService } from '../../services/paymentService';
import { InsuranceClaim } from '../../services/insuranceClaimService';

interface ClaimFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onClaimFormSigned: () => void;
}

const ClaimFormModal: React.FC<ClaimFormModalProps> = ({
  isOpen,
  onClose,
  payment,
  onClaimFormSigned
}) => {
  const [signature, setSignature] = useState<string>('');
  const [clinicianSignature, setClinicianSignature] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPatientAndConsultation = async () => {
      setLoading(true);
      try {
        if (payment && payment.patient_id) {
          const patientData = await supabasePatientService.getPatient(payment.patient_id);
          setPatient(patientData);
        }
        if (payment && payment.consultation_id) {
          const consultationData = await supabaseConsultationService.getConsultation(payment.consultation_id);
          setConsultation(consultationData);
        }
      } catch (err) {
        setPatient(null);
        setConsultation(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientAndConsultation();
  }, [payment]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'NHIF Claim Form',
  });

  // Placeholder data for fields not available in patient/payment
  const healthFacility = 'Your Clinic Name';
  const healthFacilityAddress = 'Clinic Address';
  const department = 'Dental';
  const dateOfAttendance = payment ? new Date(payment.created_at).toLocaleDateString() : '';
  const patientDOB = patient?.dateOfBirth || 'YYYY-MM-DD';
  const patientSex = patient?.gender || 'M/F';
  const patientFileNo = patient?.patientId || 'File No.';
  const patientAddress = patient?.address || 'Patient Address';
  const cardNo = patient?.insurance || 'Card No.';
  const authorizationNo = '';
  const preliminaryDiagnosis = payment ? payment.treatment_name : '';
  const finalDiagnosis = '';
  const serviceFee = payment ? payment.treatment_name : '';
  const serviceCost = payment ? payment.total_amount : '';
  const clinicianName = consultation?.doctor_name || 'Dr. Clinician';
  const clinicianQualification = 'BDS';
  const clinicianRegNo = 'Reg No.';
  const clinicianMobile = 'Mobile No.';
  const managementDescription = '';

  if (!payment) return null;
  if (loading) return <div className="p-8 text-center">Loading patient/consultation info...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature || !clinicianSignature) return;
    setSubmitting(true);
    // Define claimData outside try for error logging
    const claimData: Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at'> = {
      patient_id: payment.patient_id,
      patient_name: payment.patient_name,
      consultation_id: payment.consultation_id,
      appointment_id: payment.appointment_id,
      insurance_provider: payment.insurance_provider || '',
      treatment_details: {
        diagnosis: consultation?.diagnosis || '',
        treatment_plan: consultation?.treatment_plan || '',
        procedures: Array.isArray(consultation?.treatment_items) ? consultation.treatment_items.map(item => item.name) : [],
        total_amount: payment.total_amount,
      },
      patient_signature: signature,
      claim_status: 'submitted',
    };
    try {
      // Create insurance claim
      await insuranceClaimService.createClaim(claimData);
      // Update payment status
      await paymentService.updatePayment(payment.id, { payment_status: 'claim_submitted' });
      setSubmitting(false);
      onClaimFormSigned();
      onClose();
    } catch (err) {
      console.error('Claim form error:', err, claimData);
      setSubmitting(false);
      alert('Failed to submit claim form. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>NHIF - Health Provider In/Out Patient Claims Form</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end mb-2">
          <Button type="button" variant="outline" onClick={handlePrint}>
            Print / Export PDF
          </Button>
        </div>
        <div ref={printRef}>
          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            {/* Section A1: Health Facility */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">A1: Health Facility</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Name of Health Facility: <span className="font-medium">{healthFacility}</span></div>
                <div>Address: <span className="font-medium">{healthFacilityAddress}</span></div>
              </div>
            </div>

            {/* Section A2: Patient's Particulars */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">A2: Patient's Particulars</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Name of Patient: <span className="font-medium">{payment.patient_name}</span></div>
                <div>Department: <span className="font-medium">{department}</span></div>
                <div>Date of Attendance: <span className="font-medium">{dateOfAttendance}</span></div>
                <div>DOB: <span className="font-medium">{patientDOB}</span></div>
                <div>Sex: <span className="font-medium">{patientSex}</span></div>
                <div>Patient's File No: <span className="font-medium">{patientFileNo}</span></div>
                <div>Card No: <span className="font-medium">{cardNo}</span></div>
                <div>Authorization No: <span className="font-medium">{authorizationNo}</span></div>
                <div>Patient's Physical Address: <span className="font-medium">{patientAddress}</span></div>
                <div>Preliminary Diagnosis (code): <span className="font-medium">{preliminaryDiagnosis}</span></div>
                <div>Final Diagnosis (code): <span className="font-medium">{finalDiagnosis}</span></div>
              </div>
            </div>

            {/* Section B: Details / cost of Services */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">B: Details / Cost of Services</div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead>
                    <tr>
                      <th className="border px-2">Investigations</th>
                      <th className="border px-2">Medicine in Generic Name</th>
                      <th className="border px-2">In Patient</th>
                      <th className="border px-2">Service Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-2">-</td>
                      <td className="border px-2">-</td>
                      <td className="border px-2">-</td>
                      <td className="border px-2">{serviceFee} ({serviceCost})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-2">
                <div>GRAND TOTAL: <span className="font-bold">{serviceCost}</span></div>
              </div>
            </div>

            {/* Section C: Name of the attending Clinician */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">C: Name of the attending Clinician</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Name: <span className="font-medium">{clinicianName}</span></div>
                <div>Qualification: <span className="font-medium">{clinicianQualification}</span></div>
                <div>Reg. No: <span className="font-medium">{clinicianRegNo}</span></div>
                <div>Signature: ____________________</div>
                <div>Mobile No: <span className="font-medium">{clinicianMobile}</span></div>
              </div>
            </div>

            {/* Section D: Patient's Certification */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">D: Uthibitisho wa Mgonjwa/Patient's certification</div>
              <div className="mb-2">I certify that I received the above mentioned services as witnessed by my signature hereunder and I understand that it is illegal to provide false testimony.</div>
              <div className="w-full flex flex-col gap-2 items-start">
                <div className="font-semibold mb-1">Patient Signature:</div>
                <div className="border rounded-lg p-2 bg-white w-full">
                  <DigitalSignaturePad onSignatureChange={setSignature} label="Patient Signature" width={400} />
                </div>
                <div className="flex flex-row gap-8 mt-2">
                  <div>Jina (Name): <span className="font-medium">{payment.patient_name}</span></div>
                  <div>Tarehe (Date): <span className="font-medium">{dateOfAttendance}</span></div>
                  <div>Namba ya simu (Mobile No): {patient?.phone || '____________________'}</div>
                </div>
              </div>
            </div>

            {/* Section E: Description of management / other additional information */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">E: Description of management / other additional information</div>
              <div>{managementDescription || <span className="text-gray-400">(none)</span>}</div>
            </div>

            {/* Section F: Claimant's Certification */}
            <div className="border-b pb-2 mb-2">
              <div className="font-semibold">F: Claimant's Certification</div>
              <div className="mb-2">I certify that I provided the above services. Name: <span className="font-medium">{clinicianName}</span></div>
              <div className="flex flex-col gap-2">
                <div>Signature (Clinician):
                  <DigitalSignaturePad onSignatureChange={setClinicianSignature} label="Clinician Signature" />
                </div>
                <div>Official Stamp: ____________________</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={!signature || !clinicianSignature || submitting}>
                {submitting ? 'Submitting...' : 'Submit Claim Form'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimFormModal; 