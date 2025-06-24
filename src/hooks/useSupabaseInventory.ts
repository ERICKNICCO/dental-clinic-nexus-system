
import { useState, useEffect } from 'react';
import { supabaseInventoryService, InventoryItem, StockMovement } from '../services/supabaseInventoryService';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let inventoryChannel: RealtimeChannel | null = null;
    let movementsChannel: RealtimeChannel | null = null;

    const loadData = async () => {
      try {
        const [itemsData, movementsData] = await Promise.all([
          supabaseInventoryService.getItems(),
          supabaseInventoryService.getStockMovements()
        ]);
        
        setItems(itemsData);
        setMovements(movementsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading inventory data:', err);
        setError('Failed to load inventory data');
        setLoading(false);
      }
    };

    const setupSubscriptions = () => {
      inventoryChannel = supabaseInventoryService.subscribeToInventory(setItems);
      movementsChannel = supabaseInventoryService.subscribeToStockMovements(setMovements);
    };

    loadData().then(setupSubscriptions);

    return () => {
      if (inventoryChannel) inventoryChannel.unsubscribe();
      if (movementsChannel) movementsChannel.unsubscribe();
    };
  }, []);

  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await supabaseInventoryService.addItem(itemData);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await supabaseInventoryService.updateItem(id, updates);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await supabaseInventoryService.deleteItem(id);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
      throw err;
    }
  };

  const recordStockMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    try {
      await supabaseInventoryService.recordStockMovement(movementData);
    } catch (err) {
      console.error('Error recording stock movement:', err);
      setError('Failed to record stock movement');
      throw err;
    }
  };

  return {
    items,
    movements,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    recordStockMovement
  };
};
