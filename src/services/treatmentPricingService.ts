
export interface TreatmentPrice {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  duration: string;
  remarks?: string;
}

// Updated treatment pricing data based on the actual price list
const treatmentPrices: TreatmentPrice[] = [
  {
    id: '1',
    name: 'Consultation',
    description: 'General dental consultation and examination',
    basePrice: 15000,
    category: 'Preventive',
    duration: '30 mins',
    remarks: 'Per person'
  },
  {
    id: '2',
    name: 'JM Ready Made Metal/Gold Crown',
    description: 'Pre-fabricated metal or gold crown',
    basePrice: 65000,
    category: 'Restorative',
    duration: '60 mins',
    remarks: 'Per crown'
  },
  {
    id: '3',
    name: 'Acrylic Crown',
    description: 'Acrylic crown restoration',
    basePrice: 100000,
    category: 'Restorative',
    duration: '60 mins',
    remarks: 'Per crown'
  },
  {
    id: '4',
    name: 'Apiectomy',
    description: 'Surgical removal of tooth root tip',
    basePrice: 400000,
    category: 'Surgical',
    duration: '90 mins'
  },
  {
    id: '5',
    name: 'Bleaching',
    description: 'Professional teeth whitening treatment',
    basePrice: 120000,
    category: 'Cosmetic',
    duration: '60 mins'
  },
  {
    id: '6',
    name: 'Ceramic Crown',
    description: 'High-quality ceramic crown restoration',
    basePrice: 400000,
    category: 'Restorative',
    duration: '90 mins',
    remarks: 'Each unit'
  },
  {
    id: '7',
    name: 'Children Extraction',
    description: 'Tooth extraction for pediatric patients',
    basePrice: 45000,
    category: 'Surgical',
    duration: '30 mins',
    remarks: 'Per tooth'
  },
  {
    id: '8',
    name: 'Denture First Tooth',
    description: 'First tooth for denture construction',
    basePrice: 60000,
    category: 'Restorative',
    duration: '45 mins'
  },
  {
    id: '9',
    name: 'Denture Relining',
    description: 'Adjustment and relining of existing dentures',
    basePrice: 60000,
    category: 'Restorative',
    duration: '45 mins',
    remarks: 'But avoid relining'
  },
  {
    id: '10',
    name: 'Denture Repairs with Impression',
    description: 'Complete denture repair with new impression',
    basePrice: 50000,
    category: 'Restorative',
    duration: '60 mins'
  },
  {
    id: '11',
    name: 'Denture Repairs without Impression',
    description: 'Simple denture repair without impression',
    basePrice: 35000,
    category: 'Restorative',
    duration: '30 mins'
  },
  {
    id: '12',
    name: 'Dressing',
    description: 'Wound dressing and post-operative care',
    basePrice: 0,
    category: 'Preventive',
    duration: '15 mins',
    remarks: 'No charges'
  },
  {
    id: '13',
    name: 'Extraction Difficult',
    description: 'Complex surgical tooth extraction',
    basePrice: 200000,
    category: 'Surgical',
    duration: '60 mins',
    remarks: 'Surgical gloves included'
  },
  {
    id: '14',
    name: 'Extraction Normal',
    description: 'Standard tooth extraction',
    basePrice: 80000,
    category: 'Surgical',
    duration: '30 mins'
  },
  {
    id: '15',
    name: 'Filling Redo',
    description: 'Replacement of existing dental filling',
    basePrice: 60000,
    category: 'Restorative',
    duration: '45 mins'
  },
  {
    id: '16',
    name: 'Filling Without Post',
    description: 'Standard dental filling without post',
    basePrice: 60000,
    category: 'Restorative',
    duration: '45 mins'
  },
  {
    id: '17',
    name: 'Permanent Filling',
    description: 'Permanent dental restoration',
    basePrice: 60000,
    category: 'Restorative',
    duration: '45 mins',
    remarks: 'Per tooth'
  },
  {
    id: '18',
    name: 'Refix Crown',
    description: 'Re-cementation of existing crown',
    basePrice: 60000,
    category: 'Restorative',
    duration: '30 mins',
    remarks: 'Per coping'
  },
  {
    id: '19',
    name: 'Scaling & Polishing',
    description: 'Professional teeth cleaning and polishing',
    basePrice: 80000,
    category: 'Preventive',
    duration: '45 mins',
    remarks: 'U/L arch'
  },
  {
    id: '20',
    name: 'Sedation',
    description: 'Conscious sedation for dental procedures',
    basePrice: 150000,
    category: 'Anesthesia',
    duration: '30 mins'
  },
  {
    id: '21',
    name: 'Surfacing',
    description: 'Tooth surface treatment and preparation',
    basePrice: 100000,
    category: 'Restorative',
    duration: '30 mins',
    remarks: 'Per tooth'
  },
  {
    id: '22',
    name: 'Surgical Extraction',
    description: 'Complex surgical tooth removal',
    basePrice: 400000,
    category: 'Surgical',
    duration: '90 mins'
  },
  {
    id: '23',
    name: 'Temporary Filling',
    description: 'Temporary dental restoration',
    basePrice: 45000,
    category: 'Restorative',
    duration: '30 mins',
    remarks: 'Per tooth'
  },
  {
    id: '24',
    name: 'X-Ray Periapical',
    description: 'Single tooth X-ray examination',
    basePrice: 25000,
    category: 'Diagnostic',
    duration: '15 mins'
  },
  {
    id: '25',
    name: 'OPG X-Ray',
    description: 'Panoramic dental X-ray',
    basePrice: 70000,
    category: 'Diagnostic',
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

  // Get treatment by ID
  getTreatmentById(id: string): TreatmentPrice | undefined {
    return treatmentPrices.find(treatment => treatment.id === id);
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

  // Get treatments by category
  getTreatmentsByCategory(category: string): TreatmentPrice[] {
    return treatmentPrices.filter(treatment => 
      treatment.category.toLowerCase() === category.toLowerCase()
    );
  },

  // Get all categories
  getCategories(): string[] {
    const categories = treatmentPrices.map(treatment => treatment.category);
    return [...new Set(categories)].sort();
  },

  // Format price for display in Tsh - FIXED CALCULATION
  formatPrice(price: number): string {
    if (price === 0) {
      return 'No charge';
    }
    // Format the price correctly without multiplying by 1000
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' Tsh';
  }
};
