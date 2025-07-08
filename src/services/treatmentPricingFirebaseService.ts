
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TreatmentPricing {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const treatmentPricingFirebaseService = {
  // Add a new treatment pricing
  async addTreatmentPricing(pricingData: Omit<TreatmentPricing, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('treatmentPricingFirebaseService: Adding treatment pricing with data:', pricingData);
      
      const docRef = await addDoc(collection(db, 'treatmentPricing'), {
        ...pricingData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('treatmentPricingFirebaseService: Successfully added treatment pricing with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error adding treatment pricing:', error);
      throw error;
    }
  },

  // Get all treatment pricing
  async getAllTreatmentPricing() {
    try {
      console.log('treatmentPricingFirebaseService: Fetching all treatment pricing');
      
      const q = query(
        collection(db, 'treatmentPricing'), 
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('treatmentPricingFirebaseService: Query snapshot size:', querySnapshot.size);
      
      const pricing = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('treatmentPricingFirebaseService: Processing document:', doc.id, data);
        return {
          id: doc.id,
          name: data.name as string || '',
          description: data.description as string || '',
          price: data.price as number || 0,
          category: data.category as string || '',
          duration: data.duration as string || '',
          remarks: data.remarks as string | undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as TreatmentPricing;
      });
      
      console.log('treatmentPricingFirebaseService: Returning pricing:', pricing);
      return pricing;
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error fetching treatment pricing:', error);
      throw error;
    }
  },

  // Get treatment pricing by name
  async getTreatmentPricingByName(name: string) {
    try {
      console.log('treatmentPricingFirebaseService: Fetching treatment pricing by name:', name);
      
      const allPricing = await this.getAllTreatmentPricing();
      const pricing = allPricing.find(p => p.name.toLowerCase() === name.toLowerCase());
      
      console.log('treatmentPricingFirebaseService: Found pricing:', pricing);
      return pricing;
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error fetching treatment pricing by name:', error);
      throw error;
    }
  },

  // Subscribe to real-time treatment pricing updates
  subscribeToTreatmentPricing(callback: (pricing: TreatmentPricing[]) => void) {
    console.log('treatmentPricingFirebaseService: Setting up subscription for treatment pricing');
    
    try {
      const q = query(
        collection(db, 'treatmentPricing'), 
        orderBy('name', 'asc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        console.log('treatmentPricingFirebaseService: Received snapshot update, size:', querySnapshot.size);
        
        const pricing = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string || '',
            description: data.description as string || '',
            price: data.price as number || 0,
            category: data.category as string || '',
            duration: data.duration as string || '',
            remarks: data.remarks as string | undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as TreatmentPricing;
        });
        
        console.log('treatmentPricingFirebaseService: Calling callback with pricing:', pricing);
        callback(pricing);
      }, (error) => {
        console.error('treatmentPricingFirebaseService: Subscription error:', error);
        // Fallback to manual fetch
        this.getAllTreatmentPricing().then(callback).catch(console.error);
      });
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error setting up subscription:', error);
      throw error;
    }
  },

  // Update treatment pricing
  async updateTreatmentPricing(id: string, updates: Partial<TreatmentPricing>) {
    try {
      console.log('treatmentPricingFirebaseService: Updating treatment pricing:', id, updates);
      const pricingRef = doc(db, 'treatmentPricing', id);
      await updateDoc(pricingRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('treatmentPricingFirebaseService: Successfully updated treatment pricing:', id);
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error updating treatment pricing:', error);
      throw error;
    }
  },

  // Delete treatment pricing
  async deleteTreatmentPricing(id: string) {
    try {
      console.log('treatmentPricingFirebaseService: Deleting treatment pricing:', id);
      await deleteDoc(doc(db, 'treatmentPricing', id));
      console.log('treatmentPricingFirebaseService: Successfully deleted treatment pricing:', id);
    } catch (error) {
      console.error('treatmentPricingFirebaseService: Error deleting treatment pricing:', error);
      throw error;
    }
  },

  // Format price for display in Tsh
  formatPrice(price: number): string {
    if (price === 0) {
      return 'No charge';
    }
    return `${(price / 1000).toFixed(0)},000 Tsh`;
  }
};
