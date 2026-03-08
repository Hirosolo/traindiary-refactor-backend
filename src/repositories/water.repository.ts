import { supabase } from '@/lib/supabase';

export interface WaterLog {
  water_log_id?: number;
  user_id: number;
  amount_ml: number;
  logged_at?: string;
  log_date: string;
}

export const WaterRepository = {
  async addWater(water: WaterLog): Promise<any> {
    const { data, error } = await supabase
      .from('water_logs')
      .insert([water])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getDailyLogs(userId: number, date: string): Promise<any> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('logged_at', { ascending: true });

    if (error) throw new Error(error.message);
    
    const total = data?.reduce((acc: number, log: any) => acc + log.amount_ml, 0) || 0;
    
    return {
      logs: data,
      total_ml: total
    };
  },

  async deleteWater(logId: number, userId: number): Promise<any> {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('water_log_id', logId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  }
};
