import { supabase } from '@/lib/supabase';

/**
 * BulkRepository provides centralized methods for handling multi-entity 
 * and bulk operations safely. Currently, Supabase REST API does not support native
 * transactions, but this repository groups bulk operations together.
 * For true ACID transactions, consider calling a Supabase RPC function.
 */
export const BulkRepository = {
  /**
   * Performs bulk inserts on a given table
   */
  async bulkInsert(tableName: string, records: any[]): Promise<any[]> {
    if (!records || records.length === 0) return [];

    const { data, error } = await supabase
      .from(tableName as any)
      .insert(records)
      .select();

    if (error) {
      throw new Error(`Bulk Insert Error on ${tableName}: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Performs bulk upserts on a given table based on the provided conflict columns
   */
  async bulkUpsert(
    tableName: string,
    records: any[],
    onConflict: string = 'id'
  ): Promise<any[]> {
    if (!records || records.length === 0) return [];

    const { data, error } = await supabase
      .from(tableName as any)
      .upsert(records, { onConflict })
      .select();

    if (error) {
      throw new Error(`Bulk Upsert Error on ${tableName}: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Generic sync helper: Executes a function but throws an error
   * specifically formatted for sync failure.
   */
  async executeSync<T>(operation: () => Promise<T>, fallbackMessage: string): Promise<T> {
    try {
      return await operation();
    } catch (err: any) {
      throw new Error(`SYNC_ERROR: ${fallbackMessage} - ${err.message}`);
    }
  }
};
