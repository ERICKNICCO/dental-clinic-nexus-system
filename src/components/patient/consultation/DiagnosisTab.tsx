import React, { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Select } from '../../ui/select';
import { XRayImageGallery } from './XRayImageGallery';

interface DiagnosisTabProps {
  diagnosis: string;
  onChange: (value: string) => void;
  diagnosisType?: 'clinical' | 'xray';
  onDiagnosisTypeChange?: (type: 'clinical' | 'xray') => void;
  consultationId?: string;
  consultationStatus?: string;
  xrayResult?: { images: string[]; note: string; radiologist: string; } | null;
  onSendToXRay?: () => void;
}

// Professional diagnosis tab with type and integrated X-ray preview
const DiagnosisTab: React.FC<DiagnosisTabProps> = ({
  diagnosis,
  onChange,
  diagnosisType = 'clinical',
  onDiagnosisTypeChange,
  consultationId,
  consultationStatus,
  xrayResult,
  onSendToXRay,
}) => {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [localDiagnosis, setLocalDiagnosis] = useState(diagnosis);

  // Move useEffect to the top, before any conditional logic
  useEffect(() => {
    if (diagnosisType === undefined && onDiagnosisTypeChange) {
      onDiagnosisTypeChange('clinical');
    }
  }, [diagnosisType, onDiagnosisTypeChange]);

  useEffect(() => {
    setLocalDiagnosis(diagnosis);
  }, [diagnosis]);

  const handleDiagnosisChange = (value: string) => {
    setLocalDiagnosis(value);
    onChange(value);
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Diagnosis Type Selector */}
      <div>
        <Label htmlFor="diagnosisType">Diagnosis Type</Label>
        <select
          id="diagnosisType"
          className="mt-1 block w-full border rounded px-3 py-2 outline-none"
          value={diagnosisType}
          onChange={e =>
            onDiagnosisTypeChange && onDiagnosisTypeChange(e.target.value as 'clinical' | 'xray')
          }
        >
          <option value="clinical">Clinical</option>
          <option value="xray">X-ray</option>
        </select>
      </div>

      {/* If X-ray selected, provide X-ray workflow */}
      {diagnosisType === 'xray' && (
        <>
          {/* X-ray status workflow */}
          {consultationStatus === 'waiting-xray' && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-700">
              <strong>Waiting for X-ray…</strong>
              <div>
                Patient is being processed in the X-ray room. Images will be attached below when complete.
              </div>
            </div>
          )}
          {consultationStatus === 'xray-done' && xrayResult && (
            <div className="mb-3">
              <Label>X-ray Results</Label>
              <div className="border rounded p-2 mb-2">
                <XRayImageGallery images={xrayResult.images} />
              </div>
            </div>
          )}
          {/* Send to X-ray if status is not yet started */}
          {consultationStatus === 'in-progress' && onSendToXRay && (
            <Button
              disabled={buttonLoading}
              onClick={async () => {
                setButtonLoading(true);
                await onSendToXRay();
                setButtonLoading(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
              {buttonLoading ? 'Sending patient…' : 'Send to X-ray Room'}
            </Button>
          )}
        </>
      )}

      {/* Diagnosis textarea (always visible, can be filled after any type) */}
      <div>
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          placeholder="Primary and secondary diagnoses..."
          value={localDiagnosis}
          onChange={(e) => setLocalDiagnosis(e.target.value)}
          onBlur={() => onChange(localDiagnosis)}
          rows={4}
        />
      </div>
    </div>
  );
};

export default DiagnosisTab;
