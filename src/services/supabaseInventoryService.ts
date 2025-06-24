
import { supabase } from '../integrations/supabase/client';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level: number;
  supplier?: string;
  brand?: string;
  expiry_date?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: 'stock_in' | 'stock_out' | 'stock_take';
  quantity: number;
  remaining_stock: number;
  performed_by: string;
  reason: string;
  supplier?: string;
  brand?: string;
  expiry_date?: string;
  created_at: Date;
}

export const supabaseInventoryService = {
  // Add a new inventory item
  async addItem(itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('inventory')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  // Get all inventory items
  async getItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));
  },

  // Update inventory item
  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  // Delete inventory item
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Record stock movement
  async recordStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<string> {
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([movementData])
      .select()
      .single();

    if (movementError) throw movementError;

    // Update the inventory item stock
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ current_stock: movementData.remaining_stock })
      .eq('id', movementData.item_id);

    if (updateError) throw updateError;

    return movement.id;
  },

  // Get stock movements for an item
  async getStockMovements(itemId?: string): Promise<StockMovement[]> {
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
      ...movement,
      created_at: new Date(movement.created_at)
    }));
  },

  // Subscribe to inventory changes
  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    return supabase
      .channel('inventory')
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
  },

  // Subscribe to stock movements
  subscribeToStockMovements(callback: (movements: StockMovement[]) => void) {
    return supabase
      .channel('stock_movements')
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
  }
};
