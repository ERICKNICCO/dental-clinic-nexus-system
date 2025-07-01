
import { supabaseTreatmentPricingService } from '../services/supabaseTreatmentPricingService';

const gaPriceList = [
  {
    "S/N": 1,
    "PROCEDURE": "CONSULTATION",
    "PRICE": 15000,
    "REMARKS": "PER PERSON"
  },
  {
    "S/N": 2,
    "PROCEDURE": "ALREADY MADE METAL/GOLD CROWN",
    "PRICE": 60000,
    "REMARKS": "PER CROWN"
  },
  {
    "S/N": 3,
    "PROCEDURE": "ACRYLIC CROWN",
    "PRICE": 100000,
    "REMARKS": "PER CROWN"
  },
  {
    "S/N": 4,
    "PROCEDURE": "APICECTOMY",
    "PRICE": 30000,
    "REMARKS": "-"
  },
  {
    "S/N": 5,
    "PROCEDURE": "BLEACHING",
    "PRICE": 110000,
    "REMARKS": "-"
  },
  {
    "S/N": 6,
    "PROCEDURE": "CERAMIC CROWN",
    "PRICE": 380000,
    "REMARKS": "EACH UNIT"
  },
  {
    "S/N": 7,
    "PROCEDURE": "CHILDREN EXTRACTION",
    "PRICE": 35000,
    "REMARKS": "PER TOOTH"
  },
  {
    "S/N": 8,
    "PROCEDURE": "DENTURE PER TOOTH",
    "PRICE": 50000,
    "REMARKS": "-"
  },
  {
    "S/N": 9,
    "PROCEDURE": "DENTURE RELINING",
    "PRICE": 30000,
    "REMARKS": "BUT AVOID RELINIG"
  },
  {
    "S/N": 10,
    "PROCEDURE": "DENTURE REPAIRS WITH IMPRESSION",
    "PRICE": 45000,
    "REMARKS": "-"
  },
  {
    "S/N": 11,
    "PROCEDURE": "DENTURE REPAIRS WITHOUT IMPRESSION",
    "PRICE": 30000,
    "REMARKS": "-"
  },
  {
    "S/N": 12,
    "PROCEDURE": "DRESSING",
    "PRICE": 0,
    "REMARKS": "NO CHARGES"
  },
  {
    "S/N": 13,
    "PROCEDURE": "EXTRACTION DIFFICULT",
    "PRICE": 200000,
    "REMARKS": "SURGICAL GLOVES INCL"
  },
  {
    "S/N": 14,
    "PROCEDURE": "EXTRACTION NORMAL",
    "PRICE": 70000,
    "REMARKS": "-"
  },
  {
    "S/N": 15,
    "PROCEDURE": "FILLING AMALGAM",
    "PRICE": 60000,
    "REMARKS": "-"
  },
  {
    "S/N": 16,
    "PROCEDURE": "FILLING WITHOUT POST",
    "PRICE": 60000,
    "REMARKS": "-"
  },
  {
    "S/N": 17,
    "PROCEDURE": "RELIX CROWN",
    "PRICE": 60000,
    "REMARKS": "PER COUPING"
  },
  {
    "S/N": 18,
    "PROCEDURE": "SCALING & POLISHING",
    "PRICE": 80000,
    "REMARKS": "U/L ARCH"
  },
  {
    "S/N": 19,
    "PROCEDURE": "SEDATION",
    "PRICE": 130000,
    "REMARKS": "-"
  },
  {
    "S/N": 20,
    "PROCEDURE": "SURFACING",
    "PRICE": 100000,
    "REMARKS": "PER TOOTH"
  },
  {
    "S/N": 21,
    "PROCEDURE": "SURGICAL EXTRACTION",
    "PRICE": 380000,
    "REMARKS": "-"
  },
  {
    "S/N": 22,
    "PROCEDURE": "TEMPORARY FILLING",
    "PRICE": 25000,
    "REMARKS": "PER TOOTH"
  },
  {
    "S/N": 23,
    "PROCEDURE": "X-RAY PERIAPICAL",
    "PRICE": 25000,
    "REMARKS": "-"
  },
  {
    "S/N": 24,
    "PROCEDURE": "OPG X-RAY",
    "PRICE": 70000,
    "REMARKS": "-"
  }
];

const mapProcedureToCategory = (procedure: string): string => {
  const lowerProc = procedure.toLowerCase();
  
  if (lowerProc.includes('consultation')) return 'Preventive';
  if (lowerProc.includes('crown') || lowerProc.includes('filling') || lowerProc.includes('denture')) return 'Restorative';
  if (lowerProc.includes('extraction') || lowerProc.includes('apicectomy') || lowerProc.includes('surgical')) return 'Surgical';
  if (lowerProc.includes('bleaching')) return 'Cosmetic';
  if (lowerProc.includes('x-ray') || lowerProc.includes('opg')) return 'Diagnostic';
  if (lowerProc.includes('sedation')) return 'Anesthesia';
  if (lowerProc.includes('scaling') || lowerProc.includes('polishing') || lowerProc.includes('dressing')) return 'Preventive';
  if (lowerProc.includes('braces') || lowerProc.includes('orthodontic')) return 'Orthodontic';
  
  return 'Other';
};

export const importGAPricing = async () => {
  console.log('Starting GA pricing import...');
  
  try {
    for (const item of gaPriceList) {
      const treatmentData = {
        name: item.PROCEDURE,
        description: item.REMARKS && item.REMARKS !== '-' ? item.REMARKS : '',
        basePrice: typeof item.PRICE === 'string' ? 0 : item.PRICE,
        category: mapProcedureToCategory(item.PROCEDURE),
        duration: 30,
        insuranceProvider: 'GA',
        isActive: true
      };

      console.log('Adding GA treatment:', treatmentData);
      await supabaseTreatmentPricingService.addTreatment(treatmentData);
    }
    
    console.log('GA pricing import completed successfully');
    return { success: true, count: gaPriceList.length };
  } catch (error) {
    console.error('Error importing GA pricing:', error);
    throw error;
  }
};
