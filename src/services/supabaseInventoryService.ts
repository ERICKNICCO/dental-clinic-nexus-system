
import { supabase } from '../integrations/supabase/client';

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

export const supabaseInventoryService = {
  // Add a new inventory item
  async addItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          name: itemData.name,
          category: itemData.category,
          current_stock: itemData.currentStock,
          unit: itemData.unit,
          reorder_level: itemData.reorderLevel,
          supplier: itemData.supplier,
          brand: itemData.brand,
          expiry_date: itemData.expiryDate
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },

  // Get all inventory items
  async getItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.current_stock,
        unit: item.unit,
        reorderLevel: item.reorder_level,
        supplier: item.supplier || undefined,
        brand: item.brand || undefined,
        expiryDate: item.expiry_date || undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  // Update inventory item
  async updateItem(id: string, updates: Partial<InventoryItem>) {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.reorderLevel !== undefined) updateData.reorder_level = updates.reorderLevel;
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
      if (updates.brand !== undefined) updateData.brand = updates.brand;
      if (updates.expiryDate !== undefined) updateData.expiry_date = updates.expiryDate;

      const { error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item
  async deleteItem(id: string) {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Record stock movement
  async recordStockMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          item_id: movementData.itemId,
          item_name: movementData.itemName,
          type: movementData.type,
          quantity: movementData.quantity,
          remaining_stock: movementData.remainingStock,
          performed_by: movementData.performedBy,
          reason: movementData.reason,
          supplier: movementData.supplier,
          brand: movementData.brand,
          expiry_date: movementData.expiryDate
        })
        .select()
        .single();

      if (error) throw error;

      // Update the inventory item stock
      await this.updateItem(movementData.itemId, {
        currentStock: movementData.remainingStock
      });

      return data.id;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  },

  // Get stock movements for an item
  async getStockMovements(itemId?: string): Promise<StockMovement[]> {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(movement => ({
        id: movement.id,
        itemId: movement.item_id || '',
        itemName: movement.item_name,
        type: movement.type as 'stock_in' | 'stock_out' | 'stock_take',
        quantity: movement.quantity,
        remainingStock: movement.remaining_stock,
        performedBy: movement.performed_by,
        reason: movement.reason,
        supplier: movement.supplier || undefined,
        brand: movement.brand || undefined,
        expiryDate: movement.expiry_date || undefined,
        createdAt: new Date(movement.created_at)
      }));
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  },

  // Subscribe to inventory changes
  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        async () => {
          const items = await this.getItems();
          callback(items);
        }
      )
      .subscribe();

    return channel;
  },

  // Subscribe to stock movements
  subscribeToStockMovements(callback: (movements: StockMovement[]) => void) {
    const channel = supabase
      .channel('stock-movements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements'
        },
        async () => {
          const movements = await this.getStockMovements();
          callback(movements);
        }
      )
      .subscribe();

    return channel;
  }
};
