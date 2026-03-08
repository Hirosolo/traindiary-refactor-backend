import { supabase } from '@/lib/supabase';

export interface UserMetric {
  metric_id?: number;
  user_id: number;
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  body_fat_percentage?: number;
  is_body_fat_estimated?: boolean;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  recorded_at?: string;
}

export const MetricRepository = {
  async addMetric(metric: UserMetric): Promise<any> {
    const { data, error } = await supabase
      .from('user_metrics')
      .insert([metric])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getLatestMetric(userId: number): Promise<any> {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
};
