
import { supabaseTreatmentPricingService } from '../services/supabaseTreatmentPricingService';

const nhifPriceList = {
  "price_list": [
    {
      "category": "Minor Procedures",
      "items": [
        {
          "S/n": 1,
          "Item Code": 41034,
          "Item Name": "Apicectomy",
          "Price (TZS)": 35000
        },
        {
          "S/n": 2,
          "Item Code": 41041,
          "Item Name": "Extraction of Complex Tooth/disimpaction",
          "Price (TZS)": 35000
        },
        {
          "S/n": 3,
          "Item Code": 41046,
          "Item Name": "Flap Excision (Dental)",
          "Price (TZS)": 35000
        },
        {
          "S/n": 4,
          "Item Code": 41047,
          "Item Name": "Gingivectomy Each Tooth",
          "Price (TZS)": 3000
        },
        {
          "S/n": 5,
          "Item Code": 41053,
          "Item Name": "Intermaxillary Fixation",
          "Price (TZS)": 100000
        },
        {
          "S/n": 6,
          "Item Code": 41073,
          "Item Name": "Pterygium excision with or without conjuctival graft",
          "Price (TZS)": 35000
        },
        {
          "S/n": 7,
          "Item Code": 41031,
          "Item Name": "Pulpotomy",
          "Price (TZS)": 10000
        },
        {
          "S/n": 8,
          "Item Code": 6157,
          "Item Name": "Wound Dressing (Out Patient) Stitch removal",
          "Price (TZS)": 3000
        }
      ]
    },
    {
      "category": "Ordinary Procedures",
      "items": [
        {
          "S/n": 1,
          "Item Code": 6108,
          "Item Name": "Extraction-Permanent Tooth",
          "Price (TZS)": 10000
        },
        {
          "S/n": 2,
          "Item Code": 6528,
          "Item Name": "Otoscopy done by ENT Surgeon using Endoscope",
          "Price (TZS)": 10000
        }
      ]
    },
    {
      "category": "Specialized Procedures",
      "items": [
        {
          "S/n": 1,
          "Item Code": 6522,
          "Item Name": "Fixed Orthodontic appliance fixing per jaw (procedure and material)",
          "Price (TZS)": 275000
        },
        {
          "S/n": 2,
          "Item Code": 6424,
          "Item Name": "Denture per tooth up to 13 numbers of teeth (each)",
          "Price (TZS)": 25000
        },
        {
          "S/n": 3,
          "Item Code": 6521,
          "Item Name": "Full Denture per whole mouth (from 14 teeth and above, issued once in a life time)",
          "Price (TZS)": 300000
        },
        {
          "S/n": 4,
          "Item Code": 43007,
          "Item Name": "Cryotherapy (of Eye, Cervix, Skin etc)",
          "Price (TZS)": 60000
        },
        {
          "S/n": 5,
          "Item Code": 6220,
          "Item Name": "Endodontic Treatment - Anterior Tooth (per visit/session)",
          "Price (TZS)": 30000
        },
        {
          "S/n": 6,
          "Item Code": 6221,
          "Item Name": "Endodontic Treatment - Molar (per visit/session)",
          "Price (TZS)": 50000
        },
        {
          "S/n": 7,
          "Item Code": 6222,
          "Item Name": "Endodontic Treatment - Premolar (per visit/session)",
          "Price (TZS)": 40000
        },
        {
          "S/n": 8,
          "Item Code": 6523,
          "Item Name": "Fluoride Varnish application per tooth",
          "Price (TZS)": 20000
        },
        {
          "S/n": 9,
          "Item Code": 6509,
          "Item Name": "Fundoscopy done by Ophthalmologist using Slit Lamp",
          "Price (TZS)": 20000
        },
        {
          "S/n": 10,
          "Item Code": 6210,
          "Item Name": "Reduction of Temporomandibular Joint (TMJ)",
          "Price (TZS)": 10000
        },
        {
          "S/n": 11,
          "Item Code": 6264,
          "Item Name": "Splinting of Tooth Per quadrant",
          "Price (TZS)": 10000
        },
        {
          "S/n": 12,
          "Item Code": 6268,
          "Item Name": "Subdural tapping",
          "Price (TZS)": 25000
        },
        {
          "S/n": 13,
          "Item Code": 6271,
          "Item Name": "Tooth Extraction - Complex",
          "Price (TZS)": 10000
        },
        {
          "S/n": 14,
          "Item Code": 6516,
          "Item Name": "Tooth Filling Permanent",
          "Price (TZS)": 15000
        },
        {
          "S/n": 15,
          "Item Code": 6517,
          "Item Name": "Tooth Filling Temporary",
          "Price (TZS)": 10000
        },
        {
          "S/n": 16,
          "Item Code": 6518,
          "Item Name": "Tooth Filling With Pin Additional-Anterior",
          "Price (TZS)": 30000
        }
      ]
    }
  ]
};

export const importNHIFPricing = async () => {
  console.log('🔥 Starting NHIF pricing import...');
  
  try {
    let importedCount = 0;
    
    for (const categoryGroup of nhifPriceList.price_list) {
      console.log(`🔥 Processing category: ${categoryGroup.category}`);
      
      for (const item of categoryGroup.items) {
        try {
          const treatmentData = {
            name: item["Item Name"],
            description: `NHIF Item Code: ${item["Item Code"]}`,
            basePrice: item["Price (TZS)"],
            category: categoryGroup.category,
            duration: 30, // Default duration
            insuranceProvider: 'NHIF',
            isActive: true
          };
          
          console.log(`🔥 Adding treatment: ${treatmentData.name}`);
          await supabaseTreatmentPricingService.addTreatment(treatmentData);
          importedCount++;
          
        } catch (error) {
          console.error(`❌ Error adding treatment ${item["Item Name"]}:`, error);
          // Continue with next item even if one fails
        }
      }
    }
    
    console.log(`✅ NHIF pricing import completed! Imported ${importedCount} treatments.`);
    return importedCount;
    
  } catch (error) {
    console.error('❌ Error during NHIF pricing import:', error);
    throw error;
  }
};
