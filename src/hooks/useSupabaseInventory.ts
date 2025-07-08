
import { useState, useEffect } from 'react';
import { supabaseInventoryService, InventoryItem } from '../services/supabaseInventoryService';

export const useSupabaseInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const items = await supabaseInventoryService.getItems();
        setInventory(items);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();

    // Subscribe to real-time changes
    const channel = supabaseInventoryService.subscribeToInventory((items) => {
      setInventory(items);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await supabaseInventoryService.addItem(itemData);
      // The subscription will automatically update the state
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await supabaseInventoryService.updateItem(id, updates);
      // The subscription will automatically update the state
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await supabaseInventoryService.deleteItem(id);
      // The subscription will automatically update the state
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  return {
    inventory,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  };
};
