
import { treatmentPricingFirebaseService } from '../services/treatmentPricingFirebaseService';
import { treatmentPricingService } from '../services/treatmentPricingService';

export const importTreatmentPricingData = async () => {
  console.log('Starting import of treatment pricing data...');
  
  try {
    // Get all treatments from the static service
    const staticTreatments = treatmentPricingService.getAllTreatments();
    
    // Get existing treatments from Firebase to avoid duplicates
    const existingTreatments = await treatmentPricingFirebaseService.getAllTreatmentPricing();
    const existingNames = existingTreatments.map(t => t.name.toLowerCase());
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const treatment of staticTreatments) {
      // Skip if treatment already exists
      if (existingNames.includes(treatment.name.toLowerCase())) {
        console.log(`Skipping existing treatment: ${treatment.name}`);
        skippedCount++;
        continue;
      }
      
      // Map the treatment data to match Firebase structure
      const treatmentData = {
        name: treatment.name,
        description: treatment.description,
        price: treatment.basePrice,
        category: treatment.category,
        duration: treatment.duration,
        remarks: treatment.remarks
      };
      
      try {
        await treatmentPricingFirebaseService.addTreatmentPricing(treatmentData);
        console.log(`Successfully imported: ${treatment.name}`);
        importedCount++;
      } catch (error) {
        console.error(`Failed to import ${treatment.name}:`, error);
      }
    }
    
    console.log(`Import completed: ${importedCount} imported, ${skippedCount} skipped`);
    return { importedCount, skippedCount, total: staticTreatments.length };
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
};
