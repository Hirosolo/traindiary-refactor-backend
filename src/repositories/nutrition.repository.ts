import { supabase } from '@/lib/supabase';

export interface NutritionGoal {
  goal_id?: number;
  user_id: number;
  calories_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  hydration_target_ml: number;
  start_date: string;
}

export const NutritionRepository = {
  async upsertGoal(goalData: NutritionGoal): Promise<any> {
    const { user_id, start_date, ...targets } = goalData;
    
    // First check if a goal for this (user_id, start_date) already exists.
    // However, user said "Max 1 goal per day. Changes apply from then on."
    // Schema has UNIQUE (user_id, start_date).
    
    const { data, error } = await supabase
      .from('nutrition_goals')
      .upsert({
        user_id,
        start_date,
        ...targets
      }, {
        onConflict: 'user_id, start_date'
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getActiveGoal(userId: number, date: string): Promise<any> {
    // Find the newest goal with start_date <= date
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .lte('start_date', date)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
};
