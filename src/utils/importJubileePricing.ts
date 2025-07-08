
import { supabaseTreatmentPricingService } from '../services/supabaseTreatmentPricingService';

const jubileePriceList = [
  {
    "PROCEDURE": "CONSULTATION",
    "PRICE": "15,000",
    "JUBILEE PRICE": "10,000"
  },
  {
    "PROCEDURE": "3M READYMADE METAL/GOLD",
    "PRICE": "65,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "ACRYLIC CROWNS",
    "PRICE": "100,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "APESECTOMY",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Clarify"
  },
  {
    "PROCEDURE": "BLEACHING",
    "PRICE": "120,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "CERAMIC CROWN",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "ZIRCONIA CROWNS",
    "PRICE": "$ 400",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "CHILDRENS EXTRACTION",
    "PRICE": "45,000",
    "JUBILEE PRICE": "20,000"
  },
  {
    "PROCEDURE": "CHROME DENTURE",
    "PRICE": "800,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTAL IMPLANT",
    "PRICE": "$1200",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTAL JEWLLERY",
    "PRICE": "50,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTURE ADDITIONAL TOOTH",
    "PRICE": "50,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTURE FIRST TOOTH",
    "PRICE": "60,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTURE RELIVING",
    "PRICE": "60,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTURE REPAIRS WITH IMPRESSION",
    "PRICE": "50,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DENTURE REPAIRS WITHOUT IMPR.",
    "PRICE": "35,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "DRESSING",
    "PRICE": "No charges",
    "JUBILEE PRICE": ""
  },
  {
    "PROCEDURE": "EXTRACTION DIFFICULT",
    "PRICE": "200,000",
    "JUBILEE PRICE": "50,000"
  },
  {
    "PROCEDURE": "EXTRACTION NORMAL",
    "PRICE": "80,000",
    "JUBILEE PRICE": "30,000"
  },
  {
    "PROCEDURE": "FILLING REDO",
    "PRICE": "60,000",
    "JUBILEE PRICE": "30,000"
  },
  {
    "PROCEDURE": "FILLING WITH POST",
    "PRICE": "60,000",
    "JUBILEE PRICE": "30,000"
  },
  {
    "PROCEDURE": "FIXED BRACES-METAL",
    "PRICE": "$ 2,500",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "FIXED BRACES-CERAMIC",
    "PRICE": "$3,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "FULL METAL CROWN",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "INLAY/ONLAY",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "ORTHODONTIC REMOVABLE",
    "PRICE": "350,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "PERMANENT FILLING",
    "PRICE": "60,000",
    "JUBILEE PRICE": "30,000"
  },
  {
    "PROCEDURE": "PLASTIC DENTURE FULL",
    "PRICE": "800,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "RCT INCISORS, CANINE,PERMOLARS",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Anterior teeth-100,000. posterior to eeth-120,000"
  },
  {
    "PROCEDURE": "RE FIX CROWN",
    "PRICE": "60,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "SCALLING & POLISHING",
    "PRICE": "80,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "SEDATION",
    "PRICE": "150,000",
    "JUBILEE PRICE": "Clarify"
  },
  {
    "PROCEDURE": "SPORTS GUARD /NIGHT GUARD",
    "PRICE": "400,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "SURFACING",
    "PRICE": "100,000",
    "JUBILEE PRICE": "Not covered"
  },
  {
    "PROCEDURE": "SURGICAL EXTRACTION",
    "PRICE": "400,000",
    "JUBILEE PRICE": "50,000"
  },
  {
    "PROCEDURE": "TEMPORARY FILLING",
    "PRICE": "45,000",
    "JUBILEE PRICE": "30,000"
  },
  {
    "PROCEDURE": "X RAY PERIAPACAL",
    "PRICE": "25,000",
    "JUBILEE PRICE": "15,000"
  },
  {
    "PROCEDURE": "OPG XRAY",
    "PRICE": "70,000",
    "JUBILEE PRICE": "30,000"
  }
];

const parsePrice = (priceStr: string): number => {
  if (!priceStr || priceStr.toLowerCase().includes('not covered') || priceStr.toLowerCase().includes('no charges')) {
    return 0;
  }
  
  // Handle special cases like "Clarify" or complex descriptions
  if (priceStr.toLowerCase().includes('clarify') || priceStr.toLowerCase().includes('anterior teeth')) {
    return 0; // Will need manual review
  }
  
  // Remove commas, dollar signs, and extract numbers
  const cleanPrice = priceStr.replace(/[$,]/g, '');
  const match = cleanPrice.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

const mapProcedureToCategory = (procedure: string): string => {
  const lowerProc = procedure.toLowerCase();
  
  if (lowerProc.includes('consultation')) return 'Preventive';
  if (lowerProc.includes('crown') || lowerProc.includes('filling') || lowerProc.includes('denture') || lowerProc.includes('inlay') || lowerProc.includes('onlay')) return 'Restorative';
  if (lowerProc.includes('extraction') || lowerProc.includes('apesectomy') || lowerProc.includes('surgical') || lowerProc.includes('implant')) return 'Surgical';
  if (lowerProc.includes('bleaching') || lowerProc.includes('jewllery')) return 'Cosmetic';
  if (lowerProc.includes('x ray') || lowerProc.includes('opg')) return 'Diagnostic';
  if (lowerProc.includes('sedation')) return 'Anesthesia';
  if (lowerProc.includes('scaling') || lowerProc.includes('polishing') || lowerProc.includes('dressing')) return 'Preventive';
  if (lowerProc.includes('braces') || lowerProc.includes('orthodontic')) return 'Orthodontic';
  if (lowerProc.includes('rct')) return 'Endodontics';
  if (lowerProc.includes('guard')) return 'Prosthodontics';
  
  return 'Other';
};

export const importJubileePricing = async () => {
  console.log('Starting Jubilee pricing import...');
  
  try {
    for (const item of jubileePriceList) {
      const jubileePrice = parsePrice(item["JUBILEE PRICE"]);
      
      // Only import if there's a valid Jubilee price
      if (jubileePrice > 0) {
        const treatmentData = {
          name: item.PROCEDURE,
          description: item["JUBILEE PRICE"] && item["JUBILEE PRICE"] !== '-' ? `Jubilee coverage: ${item["JUBILEE PRICE"]}` : '',
          basePrice: jubileePrice,
          category: mapProcedureToCategory(item.PROCEDURE),
          duration: 30,
          insuranceProvider: 'JUBILEE',
          isActive: true
        };

        console.log('Adding Jubilee treatment:', treatmentData);
        await supabaseTreatmentPricingService.addTreatment(treatmentData);
      } else {
        console.log(`Skipping ${item.PROCEDURE} - not covered or needs clarification`);
      }
    }
    
    console.log('Jubilee pricing import completed successfully');
    return { success: true, count: jubileePriceList.filter(item => parsePrice(item["JUBILEE PRICE"]) > 0).length };
  } catch (error) {
    console.error('Error importing Jubilee pricing:', error);
    throw error;
  }
};
