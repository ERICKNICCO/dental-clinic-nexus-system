import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { supabasePatientService } from '../../services/supabasePatientService';
import { supabaseConsultationService } from '../../services/supabaseConsultationService';
import optimizedPaymentService, { OptimizedPayment } from '../../services/optimizedPaymentService';
import { claimsService } from '../../services/claimsService';
import { jubileeService } from '../../services/jubileeService';
import { TreatmentPricingHelper } from '../../services/treatmentPricingHelper';
import { smartApiService } from '../../services/gaInsuranceService';
import { supabase } from '../../integrations/supabase/client';

interface ClaimSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: OptimizedPayment | null;
  onSubmitted: () => void;
}

const ClaimSubmitModal: React.FC<ClaimSubmitModalProps> = ({ isOpen, onClose, payment, onSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [manualSessionId, setManualSessionId] = useState<string>('');
  const [priorPreAuthNumber, setPriorPreAuthNumber] = useState<string>(''); // For Jubilee CMS approval number

  // Normalize Jubilee Authorization / Approval numbers coming from CMS.
  // Examples:
  //  - "242875566---110011407" -> "242875566"
  //  - " 242875566  " -> "242875566"
  //  - "AUTH-242875566" -> "242875566"
  const normalizeJubileeAuthorizationNo = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    if (!trimmed) return '';

    // If CMS concatenates numbers with '---', keep only the first segment
    const firstSegment = trimmed.split('---')[0].trim();

    // Prefer the first continuous digit sequence in the first segment
    const match = firstSegment.match(/\d+/);
    if (match && match[0]) {
      return match[0];
    }

    // Fallback: return cleaned segment as-is
    return firstSegment;
  };


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (payment?.patient_id) {
          const p = await supabasePatientService.getPatient(payment.patient_id);
          setPatient(p);
        }
        if (payment?.consultation_id) {
          const c = await supabaseConsultationService.getConsultation(payment.consultation_id);
          setConsultation(c);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load patient/consultation');
      } finally {
        setLoading(false);
      }
    };
    if (isOpen && payment) load();
  }, [isOpen, payment]);

  // Try to prefetch SMART session quickly when opening for GA claims
  useEffect(() => {
    const prefetchSession = async () => {
      try {
        if (!isOpen || !payment) return;
        const providerName = (payment.insurance_provider || '').toLowerCase();
        if (!providerName.includes('ga')) return;
        // Only use clinic patient number for SMART; never fallback to UUID
        const pnum = (patient?.patientId || '').toString();
        if (!pnum) return;
        const sid = await resolveSmartSession(pnum);
        if (sid) setSessionId(sid);
      } catch { }
    };
    prefetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, payment, patient?.patientId]);

  const built = useMemo(() => {
    if (!payment) return { items: [], subtotal: 0, discountPercent: 0, discountAmount: 0, finalTotal: 0 };
    let items: Array<{ name: string; quantity: number; unit: number; total: number }> = [];
    const li: any[] = Array.isArray((payment as any).line_items) ? (payment as any).line_items : [];
    if (li.length > 0) {
      items = li.map((it: any) => {
        const q = Number(it.quantity) || 1;
        let u = Number(it.unit_price ?? it.unit_cost ?? 0) || 0;
        let t = Number(it.total_price) || u * q;
        if (q > 1 && u > 0) { const d = Math.round(u / q); if (d * q === u && (t === u || t === 0)) { u = d; t = u * q; } }
        return { name: it.item_name || it.name || '', quantity: q, unit: u, total: t };
      }).filter((x: any) => Number.isFinite(x.total) && x.total > 0);
    }
    if (items.length === 0 && (payment as any).treatmentItems) {
      try {
        const parsed = JSON.parse((payment as any).treatmentItems) || [];
        items = parsed.map((it: any) => {
          const q = Number(it.quantity) || 1;
          const raw = Number(it.unit_cost ?? it.unit ?? it.cost ?? 0) || 0;
          let u = raw; if (q > 1 && raw > 0) { const d = Math.round(raw / q); if (!Number.isNaN(d) && d * q === raw && d < raw) u = d; }
          const t = Number(it.total ?? it.line_total ?? 0) || (u * q);
          return { name: it.name, quantity: q, unit: u, total: t };
        }).filter((x: any) => Number.isFinite(x.total) && x.total > 0);
      } catch { }
    }
    // Fallback 3: use consultation.treatment_items if present
    if (items.length === 0 && consultation && Array.isArray((consultation as any).treatment_items)) {
      const arr: any[] = (consultation as any).treatment_items || [];
      items = arr.map((it: any) => {
        const q = Number(it.quantity) || 1;
        const u = Number(it.cost ?? it.unit_cost ?? 0) || 0;
        const t = u * q;
        return { name: String(it.name || ''), quantity: q, unit: u, total: t };
      }).filter((x: any) => Number.isFinite(x.total) && x.total > 0);
    }
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || (Number(it.unit) || 0) * (Number(it.quantity) || 1)), 0) || Number((payment as any).total_amount) || 0;
    let discountPercent = 0; const dpRaw: any = (payment as any).discount_percent; const parsed = Number(dpRaw); if (!Number.isNaN(parsed) && parsed > 0) discountPercent = parsed;
    const da = Number((payment as any).discount_amount) || 0; if ((!discountPercent || discountPercent === 0) && da > 0 && subtotal > 0) discountPercent = Math.round((da * 100) / subtotal);
    if ((!discountPercent || discountPercent === 0) && consultation && typeof (consultation as any).discount_percent === 'number') {
      const cdp = Number((consultation as any).discount_percent) || 0; if (cdp > 0) discountPercent = cdp;
    }
    const discountAmount = da || Math.round((subtotal * discountPercent) / 100) || 0;
    const finalTotal = Number((payment as any).final_total) || Math.max(0, subtotal - discountAmount);
    return { items, subtotal, discountPercent, discountAmount, finalTotal };
  }, [payment, consultation]);

  // Resolve SMART session fast: try ACTIVE once, then PENDING
  const resolveSmartSession = async (patientNumber: string): Promise<number> => {
    const extractSessionId = (raw: any): number => {
      if (!raw) return 0;
      const tryRead = (obj: any): number => {
        if (!obj) return 0;
        const c = (k: string) => obj?.[k];
        const val = c('sessionId') || c('session_id') || c('id') || c('visit_id') || c('visitId');
        const num = Number(val);
        return Number.isFinite(num) && num > 0 ? num : 0;
      };
      // Direct object
      let sid = tryRead(raw);
      if (sid) return sid;
      // data wrapper
      sid = tryRead(raw.data);
      if (sid) return sid;
      // content arrays
      const arrs: any[] = [];
      if (Array.isArray(raw)) arrs.push(raw);
      if (Array.isArray(raw?.data)) arrs.push(raw.data);
      if (Array.isArray(raw?.content)) arrs.push(raw.content);
      if (Array.isArray(raw?.data?.content)) arrs.push(raw.data.content);
      for (const a of arrs) {
        for (const item of a) {
          sid = tryRead(item);
          if (sid) return sid;
        }
      }
      return 0;
    };
    const tryStatus = async (status?: 'ACTIVE' | 'PENDING'): Promise<number> => {
      try {
        setProgress('Resolving SMART session...');
        const body: any = { action: 'get_session', patientNumber };
        if (status) body.sessionStatus = status;
        const { data }: any = await supabase.functions.invoke('smart-ga', { body });
        const payload = data || {};
        const norm = payload?.data || payload;
        const sid = extractSessionId(norm);
        return sid;
      } catch {
        return 0;
      } finally {
        setProgress('');
      }
    };
    let sid = await tryStatus('ACTIVE');
    if (!sid) sid = await tryStatus('PENDING');
    // Fallback: verify_member can also return a usable session when provided both numbers
    if (!sid) {
      try {
        const { data: vm }: any = await supabase.functions.invoke('smart-ga', {
          body: { action: 'verify_member', patientNumber, memberNumber: (patient?.insuranceMemberId || '').toString() }
        });
        const norm = vm || {};
        const maybe = norm?.data || norm;
        const extracted = extractSessionId(maybe);
        if (extracted) return extracted;
      } catch { }
    }
    return sid;
  };

  const handleSubmit = async () => {
    if (!payment) return;
    setSubmitting(true);
    setError(null);
    try {
      const providerName = (payment.insurance_provider || '').toLowerCase();
      const dateOfService = (payment.payment_date || payment.created_at || new Date().toISOString()).slice(0, 10);

      if (providerName.includes('jubilee')) {
        // Guardrail: prevent duplicate Jubilee claims for the same consultation.
        // If a claim already exists and is in a "live" state, do not submit again.
        if (payment.consultation_id && payment.patient_id) {
          try {
            const existingClaims = await claimsService.getClaimsByPatient(payment.patient_id);
            const duplicate = (existingClaims || []).find((c: any) => {
              const sameConsultation = c.consultation_id === payment.consultation_id;
              const sameProvider = String(c.provider || '').toLowerCase() === 'jubilee';
              const status = String(c.status || '').toLowerCase();
              const isLiveStatus = ['submitted', 'processing', 'approved', 'paid'].includes(status);
              return sameConsultation && sameProvider && isLiveStatus;
            });

            if (duplicate) {
              const createdAt = duplicate.created_at
                ? new Date(duplicate.created_at).toLocaleString()
                : 'earlier';
              throw new Error(
                `A Jubilee claim for this consultation has already been submitted (${createdAt}).\n` +
                `You can view and track it in the Insurance Claims page instead of submitting again.`
              );
            }
          } catch (e: any) {
            // If the check itself fails, surface the error so the user understands why submission is blocked.
            if (e instanceof Error) {
              throw e;
            }
            throw new Error('Failed to check existing Jubilee claims. Please try again.');
          }
        }

        const memberId = (patient?.insuranceMemberId || patient?.insurance_member_id || '').toString();
        if (!memberId) throw new Error('Missing Jubilee Member Number on patient file.');
        if (!(built.items && built.items.length > 0 && built.subtotal > 0)) {
          throw new Error('No billable items found. Add treatment items before submitting a claim.');
        }
        if (!consultation?.diagnosis) {
          throw new Error('Diagnosis is required for Jubilee claims. Please update the consultation.');
        }

        // Fetch the latest AuthorizationNo directly from Jubilee using enhanced verification.
        // This is the official AuthorizationNo field returned by Jubilee (e.g. "242875566")
        // and is what their SendClaim API expects, regardless of how CMS displays Approval #.
        setProgress('Verifying member with Jubilee for Authorization number...');
        let verificationAuthNo: string | null = null;
        try {
          const verification = await jubileeService.verifyMemberEnhanced(memberId);
          if (verification?.success && verification.authorization_no) {
            verificationAuthNo = verification.authorization_no;
            console.log('📋 Authorization number from Jubilee verification:', verificationAuthNo);
          } else {
            console.warn('⚠️ No authorization number returned from Jubilee verification:', verification);
          }
        } catch (e) {
          console.warn('⚠️ Failed to fetch authorization number from Jubilee verification:', e);
        } finally {
          setProgress('');
        }

        // Map items → Jubilee procedures (basic code map with safe fallback)
        const CODE_MAP: Record<string, string> = {
          'CONSULTATION': 'DENT_CONSULT',
          'GENERAL CONSULTATION': 'DENT_CONSULT',
          'BLEACHING': 'DENT_BLEACH',
          'EXTRACTION': 'DENT_EXTRACT',
          'OPG': 'DENT_OPG',
          'X-RAY': 'DENT_OPG',
          'ROOT CANAL': 'DENT_RCT',
          'CROWN': 'DENT_CROWN',
          'BRIDGE': 'DENT_BRIDGE',
          'FILLING': 'DENT_FILLING',
        };
        const toKey = (s: string) => String(s || '').toUpperCase();
        const mapCode = (name: string) => {
          const k = toKey(name);
          const hit = Object.keys(CODE_MAP).find(codeKey => k.includes(codeKey));
          return hit ? CODE_MAP[hit] : ('JIC_' + k.replace(/\s+/g, '_'));
        };
        const procedures = built.items.map(it => ({
          procedure_id: mapCode(it.name),
          procedure_name: it.name,
          amount: Math.round(Number(it.unit) || 0),
          quantity: Math.round(Number(it.quantity) || 1),
          line_total: Math.round((Number(it.unit) || 0) * (Number(it.quantity) || 1))
        }));

        // For Jubilee we expect that a pre-authorization has already been created
        // from the Insurance Benefits tab. Find the latest APPROVED pre-auth
        // for this consultation/patient and reuse its AuthorizationNo.
        setProgress('Looking for approved Jubilee pre-authorization...');
        const allClaimsForPatient = await claimsService.getClaimsByPatient(payment.patient_id);
        const matchingPreauths = (allClaimsForPatient || [])
          .filter((c: any) =>
            (c.provider || '').toLowerCase() === 'jubilee' &&
            typeof c.claim_no === 'string' &&
            c.claim_no.startsWith('PREAUTH-') &&
            (c.consultation_id === payment.consultation_id || !payment.consultation_id) &&
            (c.status === 'approved' || c.status === 'pending')
          )
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const latestPreauth = matchingPreauths[0];

        // Priority for authorization number:
        // 1. Authorization number from real-time Jubilee verification (official AuthorizationNo)
        // 2. Manual Prior Pre-Authorization number from Jubilee CMS (entered by user)
        // 3. Authorization number from stored pre-authorization
        let authorizationNo = '';

        if (verificationAuthNo) {
          authorizationNo = normalizeJubileeAuthorizationNo(verificationAuthNo);
          console.log('📋 Using authorization number from Jubilee verification (normalized):', authorizationNo);
        } else if (priorPreAuthNumber && priorPreAuthNumber.trim()) {
          // User manually entered the Prior Pre-Auth number from Jubilee CMS
          authorizationNo = normalizeJubileeAuthorizationNo(priorPreAuthNumber);
          console.log('📋 Using manual Prior Pre-Authorization number from CMS (normalized):', authorizationNo);
        } else if (latestPreauth?.authorization_no) {
          // Use authorization number from stored pre-authorization
          authorizationNo = normalizeJubileeAuthorizationNo(String(latestPreauth.authorization_no || ''));
          console.log('📋 Using authorization number from stored pre-auth (normalized):', authorizationNo);
        } else {
          throw new Error(
            'No authorization number available. Please either:\n' +
            '1. Enter the Prior Pre-Authorization number from Jubilee CMS portal, OR\n' +
            '2. Complete a pre-authorization first in Insurance Benefits tab.'
          );
        }

        // Validate that we have a valid authorization number
        if (!authorizationNo || authorizationNo === '') {
          throw new Error(
            'Invalid authorization number. Please enter the Prior Pre-Authorization number from Jubilee CMS portal.'
          );
        }

        console.log('📋 Final authorization number for claim:', authorizationNo);

        let claimNo = '';
        let status: string = 'pending';

        // We already know pre-auth is approved (or at least pending). Proceed to claim submission.
        setProgress('Submitting claim to Jubilee...');

        // Build treatment details for complete claim submission using official Jubilee procedure IDs
        const treatmentDetails = await Promise.all(
          built.items.map(async (it) => {
            const name = String(it.name || '');
            const quantity = Math.round(Number(it.quantity) || 1);
            const unitFromItem = Math.round(Number(it.unit) || 0);
            const totalFromItem = Math.round(Number(it.total) || 0);
            const unitPriceFallback =
              unitFromItem > 0
                ? unitFromItem
                : quantity > 0
                  ? Math.round(totalFromItem / quantity)
                  : 0;

            let itemCode = '65082710'; // Sensible default
            let diagnosisCode = 'K02.9';

            try {
              const details = await TreatmentPricingHelper.getJubileeTreatmentDetails(name);
              if (details) {
                itemCode = details.procedureId || itemCode;
                diagnosisCode = details.diagnosisCode || diagnosisCode;
              }
            } catch (e) {
              console.warn('Failed to resolve Jubilee treatment details for', name, e);
            }

            return {
              itemCode,
              itemName: name,
              quantity,
              unitPrice: unitPriceFallback,
              diagnosisCode,
            };
          })
        );

        const claimResult = await jubileeService.submitCompleteClaim({
          // Use the visible clinic patient file number (e.g. SD-25-88430) when available,
          // falling back to the internal UUID only if necessary.
          patientId: (patient?.patientId || payment.patient_id) as string,
          patientName: patient?.name || payment.patient_name,
          memberId: memberId,
          authorizationNo,
          consultationId: payment.consultation_id || '',
          treatmentDetails,
          totalAmount: built.finalTotal,
          attendanceDate: dateOfService,
          practitionerNo: 'MCTER1234', // TODO: derive from logged-in doctor
          createdBy: 'System User', // TODO: derive from logged-in user
        });

        if (!claimResult.success) {
          throw new Error(claimResult.error || 'Claim submission failed');
        }

        claimNo = claimResult.submission_id || '';
        status = 'submitted';

        try {
          await claimsService.addClaim({
            consultation_id: payment.consultation_id || '',
            patient_id: payment.patient_id,
            provider: 'JUBILEE',
            member_number: memberId,
            authorization_no: authorizationNo,
            claim_no: claimNo,
            status: status as any,
            total_amount: built.finalTotal,
            approved_amount: 0,
            patient_copayment: 0,
            deductible_amount: 0,
            submission_id: status === 'submitted' ? (claimNo || null) : null,
            raw_payload: { items: built.items },
            raw_response: { preauth: latestPreauth }
          } as any);
        } catch { }

        await optimizedPaymentService.updatePaymentStatus(payment.id, 'claim_submitted');
        onSubmitted();
        onClose();
        return;
      }

      if (providerName.includes('ga') || providerName.includes('smart')) {
        const memberId = (patient?.insuranceMemberId || patient?.insurance_member_id || '').toString();
        if (!memberId) throw new Error('Missing GA Member Number on patient file.');
        // For SMART, the patientNumber must be the clinic patientId (e.g., SD-25-00247)
        const pnum = (patient?.patientId || memberId).toString();
        let sid = sessionId || await resolveSmartSession(pnum);
        if ((!sid || Number(sid) <= 0) && manualSessionId && Number(manualSessionId) > 0) {
          sid = Number(manualSessionId);
        }
        if (!sid || Number(sid) <= 0) {
          const errorMsg = `No SMART session found for ${pnum}. 
          
To fix this:
1. Patient must swipe their SMART card at the clinic first
2. SMART card creates a session in the GA system  
3. Once session exists, claims can be submitted
4. Contact GA support if card swipe doesn't work

This is a GA requirement - sessions cannot be created automatically without physical card swipe.`;
          throw new Error(errorMsg);
        }
        // Build SMART claim (Upload Claim/Invoice) payload exactly as API expects
        const now = new Date();
        const nowIso = now.toISOString();
        const nowDate = nowIso.substring(0, 10);
        const nowTime = new Date().toTimeString().split(' ')[0];
        const invoiceNumber = `INV_${payment.consultation_id || ''}_${Date.now()}`;
        const receiptNumber = `RCP_${(payment.id || '').toString().slice(0, 8)}_${Date.now()}`;

        // Compute payment modifiers based on discount and (optional) clinic GA copay settings
        const paymentModifiers: Array<{ type: string; amount: number; reference_number: string }> = [];
        const discountAmount = Number(built.discountAmount || 0);
        if (discountAmount > 0) {
          paymentModifiers.push({ type: '6', amount: discountAmount, reference_number: receiptNumber });
        }
        // Attempt to read GA copay settings from DB (best-effort, ignored on failure)
        try {
          const { data } = await supabase
            .from('insurance_config')
            .select('provider, copay_type, copay_value')
            .eq('provider', 'GA')
            .single();
          if (data && data.copay_type && Number(data.copay_value) > 0) {
            const value = Number(data.copay_value);
            if (String(data.copay_type).toLowerCase() === 'fixed') {
              paymentModifiers.push({ type: '1', amount: value, reference_number: receiptNumber });
            } else if (String(data.copay_type).toLowerCase() === 'percent') {
              const amt = Math.round((built.finalTotal || 0) * (value / 100));
              paymentModifiers.push({ type: '2', amount: amt, reference_number: receiptNumber });
            }
          }
        } catch { }
        const claimCode = `CLAIM_${payment.consultation_id || ''}_${Date.now()}`;
        const claimPayload: any = {
          claim_code: claimCode,
          payer_code: 'GA',
          payer_name: 'GA Insurance',
          medicalaid_code: 'GA',
          amount: built.finalTotal,
          gross_amount: built.finalTotal,
          batch_number: `BATCH_${Date.now()}`,
          dispatch_date: `${nowDate} 00:00:00`,
          patient_number: pnum,
          patient_name: patient?.name || payment.patient_name,
          location_code: 'SD_DENTAL',
          location_name: 'SD Dental Clinic',
          scheme_code: 'GA_SCHEME',
          scheme_name: 'GA Insurance Scheme',
          member_number: memberId,
          visit_number: payment.consultation_id || '',
          session_id: sid,
          visit_start: `${nowDate} ${nowTime}`,
          currency: 'TZS',
          doctor_name: consultation?.doctor_name || 'Clinic Doctor',
          sp_id: 1,
          diagnosis: [
            { code: 'K02.9', coding_standard: 'ICD10', is_added_with_claim: true, name: 'Dental caries', is_primary: true }
          ],
          pre_authorization: [],
          invoices: [
            {
              amount: built.finalTotal,
              gross_amount: built.finalTotal,
              invoice_date: `${nowDate} 00:00:00`,
              invoice_number: invoiceNumber,
              invoice_ref_number: invoiceNumber,
              lines: built.items.map((it, idx) => ({
                serial_no: idx + 1,
                additional_info: '',
                amount: Math.round((it.unit || 0) * (it.quantity || 1)),
                charge_date: nowDate,
                charge_time: nowTime,
                item_code: (it.name || '').toString().toUpperCase().includes('CONSULT') ? 'CONS-111' : 'DENT-001',
                item_name: it.name,
                pre_authorization_code: '',
                quantity: it.quantity || 1,
                service_group: 'DENTAL',
                unit_price: it.unit || 0,
              })),
              payment_modifiers: paymentModifiers,
              pool_number: '1',
              service_type: 'Outpatient',
            }
          ]
        };

        const claimDataForService = {
          member_id: memberId,
          provider_id: 'SD_DENTAL',
          consultation_id: payment.consultation_id || '',
          diagnosis_code: 'K02.9',
          treatments: built.items.map(it => ({ code: (it.name || '').toUpperCase().slice(0, 8), description: it.name, cost: it.total })),
          total_amount: built.finalTotal,
          date_of_service: nowDate
        };

        // Call centralized SMART service which will use Edge Function actions and fallbacks
        const result: any = await smartApiService.submitClaimNew(claimDataForService);

        // Normalize returned claim id and status
        const returned = result || {};
        const claimNo = (returned.claimId || returned.claim_id || returned.data?.claim_id || returned.data?.id || invoiceNumber).toString();
        const rawStatus = String(returned.status || returned.submissionStatus || returned.data?.status || returned.data?.claim_status || '').toUpperCase();
        const mappedStatus: any = rawStatus === 'CANCELLED' ? 'cancelled' : rawStatus === 'PENDING' ? 'processing' : 'submitted';

        try {
          await claimsService.addClaim({
            consultation_id: payment.consultation_id || '',
            patient_id: payment.patient_id,
            provider: 'GA',
            authorization_no: '',
            claim_no: claimNo,
            status: mappedStatus,
            total_amount: built.finalTotal,
            approved_amount: 0,
            patient_copayment: 0,
            deductible_amount: 0,
            raw_payload: claimPayload,
            raw_response: returned
          } as any);
        } catch (err) {
          console.warn('Failed to persist GA claim record:', err);
        }

        await optimizedPaymentService.updatePaymentStatus(payment.id, 'claim_submitted');
        onSubmitted();
        onClose();
        return;
      }

      throw new Error('Unsupported insurance provider for API submission');
    } catch (e: any) {
      setError(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Claim</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>}
            <div className="text-sm">
              <div className="font-semibold mb-1">Patient</div>
              <div>{payment.patient_name}</div>
              <div className="text-gray-500">{payment.insurance_provider || 'Insurance'}</div>
              {(payment.insurance_provider || '').toLowerCase().includes('ga') && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">SMART Session ID (optional if auto-detected)</div>
                  <input
                    type="number"
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="Enter session id if GA confirms it"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Treatment</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Unit</th>
                    <th className="text-right p-2">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {built.items.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{it.name}</td>
                      <td className="p-2 text-right">{it.quantity}</td>
                      <td className="p-2 text-right">{it.unit.toLocaleString()}</td>
                      <td className="p-2 text-right">{(it.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="p-2 text-right font-semibold" colSpan={3}>Subtotal</td>
                    <td className="p-2 text-right">{built.subtotal.toLocaleString()}</td>
                  </tr>
                  {built.discountAmount > 0 && (
                    <tr>
                      <td className="p-2 text-right font-semibold" colSpan={3}>Discount ({built.discountPercent}%)</td>
                      <td className="p-2 text-right">-{built.discountAmount.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 text-right font-semibold" colSpan={3}>Total</td>
                    <td className="p-2 text-right font-bold">{built.finalTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Claim'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimSubmitModal;


