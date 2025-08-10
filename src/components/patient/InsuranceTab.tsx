import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gaInsuranceService } from '@/services/gaInsuranceService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface InsuranceTabProps {
  patientId: string;
  patientName: string;
}

interface PatientInsuranceData {
  insurance?: string | null;
  insurance_member_id?: string | null;
  smart_patient_number?: string | null;
  patient_id?: string | null;
}

export const InsuranceTab: React.FC<InsuranceTabProps> = ({ patientId, patientName }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PatientInsuranceData>({});
  const [verification, setVerification] = useState<any | null>(null);
  const [benefits, setBenefits] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('insurance, insurance_member_id, smart_patient_number, patient_id')
        .eq('id', patientId)
        .maybeSingle();
      if (error) {
        toast({ title: 'Failed to load insurance data', description: error.message, variant: 'destructive' });
      } else {
        const loaded = (data || {}) as PatientInsuranceData;
        if (!loaded.smart_patient_number && loaded.patient_id) {
          loaded.smart_patient_number = loaded.patient_id; // default to clinic ID e.g., SD-25-88413
        }
        setData(loaded);
      }
      setLoading(false);
    };
    if (patientId) load();
  }, [patientId, toast]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('patients')
      .update({
        insurance: data.insurance || null,
        insurance_member_id: data.insurance_member_id || null,
        smart_patient_number: data.smart_patient_number || null,
        patient_type: (data.insurance ? 'insurance' : 'cash') as any,
      })
      .eq('id', patientId);
    setSaving(false);
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Saved', description: 'Insurance identifiers updated' });
  };

  const onVerify = async () => {
    const patientNumber = data.smart_patient_number || data.insurance_member_id;
    if (!patientNumber) {
      return toast({ title: 'Missing identifier', description: 'Enter smart_patient_number or member number', variant: 'destructive' });
    }
    const { data: resp, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'verify_member', patientNumber }
    });
    if (error) return toast({ title: 'Verification error', description: error.message, variant: 'destructive' });
    setVerification(resp);
    if (resp?.ok === false) {
      toast({ title: 'Verification failed', description: String(resp?.error || resp?.data?.body || 'Unknown error'), variant: 'destructive' });
    } else {
      toast({ title: 'Member verified' });
    }
  };

  const onBenefits = async () => {
    const patientNumber = data.smart_patient_number || data.insurance_member_id;
    if (!patientNumber) {
      return toast({ title: 'Missing SMART identifier', description: 'Enter smart_patient_number or member number', variant: 'destructive' });
    }
    const { data: resp, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'get_benefits', patientNumber }
    });
    if (error) return toast({ title: 'Benefits error', description: error.message, variant: 'destructive' });
    const inner = resp?.data ?? resp;
    if (inner?.ok === false) {
      return toast({ title: 'Benefits error', description: String(inner?.body || inner?.error || 'Unknown error'), variant: 'destructive' });
    }
    setBenefits(inner?.data ?? inner);
    toast({ title: 'Benefits fetched' });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Insurance Provider</Label>
            <Input value={data.insurance || ''} onChange={(e) => setData({ ...data, insurance: e.target.value })} placeholder="GA Insurance" />
          </div>
          <div>
            <Label>insurance_member_id (SMART member_number)</Label>
            <Input value={data.insurance_member_id || ''} onChange={(e) => setData({ ...data, insurance_member_id: e.target.value })} placeholder="e.g., SD-25-88413" />
          </div>
          <div>
            <Label>smart_patient_number (optional)</Label>
            <Input value={data.smart_patient_number || ''} onChange={(e) => setData({ ...data, smart_patient_number: e.target.value })} placeholder="From card swipe/session" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          <Button variant="secondary" onClick={onVerify}>Verify Member</Button>
          <Button variant="outline" onClick={onBenefits}>Get Benefits</Button>
        </div>
      </Card>

      {verification && (
        <Card className="p-4">
          <h3 className="font-medium mb-2">Verification</h3>
          <pre className="text-xs overflow-auto max-h-[300px]">{JSON.stringify(verification, null, 2)}</pre>
        </Card>
      )}

      {benefits && (
        <Card className="p-4">
          <h3 className="font-medium mb-2">Benefits</h3>
          <pre className="text-xs overflow-auto max-h-[400px]">{JSON.stringify(benefits, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};
