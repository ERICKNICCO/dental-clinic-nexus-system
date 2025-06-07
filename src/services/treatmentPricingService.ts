
export interface TreatmentPrice {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  duration: string;
}

// Sample treatment pricing data - in a real system this would come from a database
const treatmentPrices: TreatmentPrice[] = [
  {
    id: '0',
    name: 'Consultation',
    description: 'General medical consultation and examination',
    basePrice: 30000,
    category: 'Preventive',
    duration: '30 mins'
  },
  {
    id: '1',
    name: 'Dental Cleaning',
    description: 'Professional cleaning to remove plaque and tartar',
    basePrice: 180000,
    category: 'Preventive',
    duration: '30 mins'
  },
  {
    id: '2',
    name: 'Root Canal',
    description: 'Treatment for infected pulp in the root of a tooth',
    basePrice: 1800000,
    category: 'Restorative',
    duration: '90 mins'
  },
  {
    id: '3',
    name: 'Teeth Whitening',
    description: 'Professional whitening treatment',
    basePrice: 800000,
    category: 'Cosmetic',
    duration: '60 mins'
  },
  {
    id: '4',
    name: 'Dental Implant',
    description: 'Artificial tooth root placed into the jaw',
    basePrice: 3400000,
    category: 'Restorative',
    duration: '120 mins'
  },
  {
    id: '5',
    name: 'Braces Adjustment',
    description: 'Regular adjustment of dental braces',
    basePrice: 450000,
    category: 'Orthodontic',
    duration: '45 mins'
  },
  {
    id: '6',
    name: 'Filling',
    description: 'Dental restoration using composite or amalgam',
    basePrice: 340000,
    category: 'Restorative',
    duration: '45 mins'
  },
  {
    id: '7',
    name: 'Extraction',
    description: 'Tooth removal procedure',
    basePrice: 270000,
    category: 'Surgical',
    duration: '30 mins'
  },
  {
    id: '8',
    name: 'Checkup',
    description: 'Regular dental examination',
    basePrice: 135000,
    category: 'Preventive',
    duration: '20 mins'
  }
];

export const treatmentPricingService = {
  // Get all available treatments with pricing
  getAllTreatments(): TreatmentPrice[] {
    return treatmentPrices;
  },

  // Get treatment by name
  getTreatmentByName(name: string): TreatmentPrice | undefined {
    return treatmentPrices.find(treatment => 
      treatment.name.toLowerCase() === name.toLowerCase()
    );
  },

  // Search treatments by name or category
  searchTreatments(query: string): TreatmentPrice[] {
    const lowerQuery = query.toLowerCase();
    return treatmentPrices.filter(treatment =>
      treatment.name.toLowerCase().includes(lowerQuery) ||
      treatment.category.toLowerCase().includes(lowerQuery) ||
      treatment.description.toLowerCase().includes(lowerQuery)
    );
  },

  // Format price for display in Tsh
  formatPrice(price: number): string {
    return `${(price / 1000).toFixed(2)} Tsh`;
  }
};
