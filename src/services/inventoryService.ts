// Legacy Firebase service - use supabaseInventoryService instead
export { supabaseInventoryService as inventoryService } from './supabaseInventoryService';

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