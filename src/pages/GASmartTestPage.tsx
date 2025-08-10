import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gaInsuranceService } from '@/services/gaInsuranceService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function GASmartTestPage() {
  const { toast } = useToast();
  const [patientNumber, setPatientNumber] = useState('SD-25-88413');
  const [sessionId, setSessionId] = useState('');
  const [visitNumber, setVisitNumber] = useState('TEST-VISIT-001');
  const [memberNumber, setMemberNumber] = useState('SD-25-88413');
  const [diagnosisCode, setDiagnosisCode] = useState('K02.9');
  const [output, setOutput] = useState<any>(null);
  const [diagnosisBody, setDiagnosisBody] = useState<string>(JSON.stringify({
    patient_number: 'SD-25-88413',
    visit_number: 'TEST-VISIT-001',
    diagnoses: [{ code: 'K02.9', description: 'Dental caries, unspecified', coding_standard: 'ICD-10' }],
    payer_code: 'GA',
    provider_code: 'SD_DENTAL',
    sp_id: '1'
  }, null, 2));
  const [claimBody, setClaimBody] = useState<string>(JSON.stringify({
    patient_number: 'SD-25-88413',
    visit_number: 'TEST-VISIT-001',
    member_number: 'SD-25-88413',
    payer_code: 'GA',
    provider_code: 'SD_DENTAL',
    sp_id: '1',
    drugs: [],
    laboratory: [],
    radiology: [],
    procedure: [
      { item_code: 'DENT001', item_name: 'Consultation', price: 30000, quantity: 1, amount: 30000 }
    ],
    other: []
  }, null, 2));

  const show = (title: string, data: any) => {
    console.log(title, data);
    setOutput({ title, data });
    toast({ title, description: 'Done' });
  };

  const onGetToken = async () => {
    const { data, error } = await supabase.functions.invoke('smart-ga', { body: { action: 'get_token' } });
    if (error) return toast({ title: 'Token error', description: String(error.message), variant: 'destructive' });
    show('Token', data);
  };

  const onGetSession = async () => {
    const { data, error } = await supabase.functions.invoke('smart-ga', { body: { action: 'get_session', patientNumber } });
    if (error) return toast({ title: 'Session error', description: String(error.message), variant: 'destructive' });
    const sid = data?.data?.sessionId || data?.data?.session_id || data?.sessionId || data?.id || '';
    if (sid) setSessionId(String(sid));
    show('Session', data);
  };

  const onVerify = async () => {
    const res = await gaInsuranceService.verifyMember({
      memberNumber,
      patientDetails: { name: 'Test', dateOfBirth: '1990-01-01', idNumber: 'NA' }
    });
    show('Verify Member', res);
  };

  const onBenefits = async () => {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'get_benefits', patientNumber, sessionId }
    });
    if (error) return toast({ title: 'Benefits error', description: String(error.message), variant: 'destructive' });
    show('Benefits', data);
  };

  const onPostDiagnosis = async () => {
    let body: any;
    try { body = JSON.parse(diagnosisBody); } catch (e) {
      return toast({ title: 'Invalid diagnosis JSON', description: String(e), variant: 'destructive' });
    }
    const data = await gaInsuranceService.postDiagnosis(body);
    show('Post Diagnosis', data);
  };

  const onSubmitFinalClaim = async () => {
    let body: any;
    try { body = JSON.parse(claimBody); } catch (e) {
      return toast({ title: 'Invalid claim JSON', description: String(e), variant: 'destructive' });
    }
    const data = await gaInsuranceService.submitFinalClaim(body);
    show('Submit Final Claim', data);
  };

  return (
    <main className="container mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">SMART (GA) Dev Tester</h1>
        <p className="text-sm opacity-80">Use this page to exercise the SMART endpoints in dev.</p>
        <link rel="canonical" href="/ga-test" />
      </header>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">SMART patientNumber</label>
            <Input value={patientNumber} onChange={(e) => setPatientNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">SMART sessionId</label>
            <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Hospital visitNumber</label>
            <Input value={visitNumber} onChange={(e) => setVisitNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">SMART member_number</label>
            <Input value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onGetToken}>Get Token</Button>
          <Button onClick={onGetSession} variant="secondary">Get Session</Button>
          <Button onClick={onVerify} variant="outline">Verify Member</Button>
          <Button onClick={onBenefits} variant="outline">Get Benefits</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm">ICD-10 Code</label>
            <Input value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} />
          </div>
        </div>
        <label className="text-sm">Diagnosis JSON</label>
        <Textarea rows={8} value={diagnosisBody} onChange={(e) => setDiagnosisBody(e.target.value)} />
        <Button onClick={onPostDiagnosis}>Post Diagnosis</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <label className="text-sm">Final Claim JSON</label>
        <Textarea rows={10} value={claimBody} onChange={(e) => setClaimBody(e.target.value)} />
        <Button onClick={onSubmitFinalClaim}>Submit Final Claim</Button>
      </Card>

      {output && (
        <Card className="p-4">
          <h2 className="font-medium mb-2">{output.title}</h2>
          <pre className="text-xs overflow-auto max-h-[400px]">
            {JSON.stringify(output.data, null, 2)}
          </pre>
        </Card>
      )}
    </main>
  );
}
