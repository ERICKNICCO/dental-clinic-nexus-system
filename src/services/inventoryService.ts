
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
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  supplier?: string;
  brand?: string;
  expiryDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'stock_in' | 'stock_out' | 'stock_take';
  quantity: number;
  remainingStock: number;
  performedBy: string;
  reason: string;
  supplier?: string;
  brand?: string;
  expiryDate?: string;
  createdAt: Date;
}

export const inventoryService = {
  // Add a new inventory item
  async addItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },

  // Get all inventory items
  async getItems() {
    try {
      const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: (data.name as string) || '',
          category: (data.category as string) || '',
          currentStock: (data.currentStock as number) || 0,
          unit: (data.unit as string) || '',
          reorderLevel: (data.reorderLevel as number) || 0,
          supplier: data.supplier as string | undefined,
          brand: data.brand as string | undefined,
          expiryDate: data.expiryDate as string | undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as InventoryItem;
      });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  // Update inventory item
  async updateItem(id: string, updates: Partial<InventoryItem>) {
    try {
      const itemRef = doc(db, 'inventory', id);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item
  async deleteItem(id: string) {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Record stock movement
  async recordStockMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'stock_movements'), {
        ...movementData,
        createdAt: Timestamp.now()
      });

      // Update the inventory item stock
      const itemRef = doc(db, 'inventory', movementData.itemId);
      await updateDoc(itemRef, {
        currentStock: movementData.remainingStock,
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  },

  // Get stock movements for an item
  async getStockMovements(itemId?: string) {
    try {
      let q;
      if (itemId) {
        q = query(
          collection(db, 'stock_movements'), 
          where('itemId', '==', itemId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(collection(db, 'stock_movements'), orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          itemId: data.itemId || '',
          itemName: data.itemName || '',
          type: data.type || 'stock_in',
          quantity: data.quantity || 0,
          remainingStock: data.remainingStock || 0,
          performedBy: data.performedBy || '',
          reason: data.reason || '',
          supplier: data.supplier,
          brand: data.brand,
          expiryDate: data.expiryDate,
          createdAt: data.createdAt?.toDate() || new Date()
        } as StockMovement;
      });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  },

  // Subscribe to inventory changes
  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: (data.name as string) || '',
          category: (data.category as string) || '',
          currentStock: (data.currentStock as number) || 0,
          unit: (data.unit as string) || '',
          reorderLevel: (data.reorderLevel as number) || 0,
          supplier: data.supplier as string | undefined,
          brand: data.brand as string | undefined,
          expiryDate: data.expiryDate as string | undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as InventoryItem;
      });
      callback(items);
    });
  },

  // Subscribe to stock movements
  subscribeToStockMovements(callback: (movements: StockMovement[]) => void) {
    const q = query(collection(db, 'stock_movements'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const movements = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          itemId: data.itemId || '',
          itemName: data.itemName || '',
          type: data.type || 'stock_in',
          quantity: data.quantity || 0,
          remainingStock: data.remainingStock || 0,
          performedBy: data.performedBy || '',
          reason: data.reason || '',
          supplier: data.supplier,
          brand: data.brand,
          expiryDate: data.expiryDate,
          createdAt: data.createdAt?.toDate() || new Date()
        } as StockMovement;
      });
      callback(movements);
    });
  }
};
