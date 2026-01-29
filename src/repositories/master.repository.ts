import { supabase } from '@/lib/supabase';

export interface Food {
  food_id: number;
  name: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  serving_type: string;
  image?: string;
}

export const FoodRepository = {
  async findAll(searchQuery?: string): Promise<Food[]> {
    let query = supabase
      .from('foods')
      .select('*')
      .order('name', { ascending: true });

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async findById(id: number): Promise<Food | null> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('food_id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  },

  async create(foodData: any): Promise<Food> {
    const { data, error } = await supabase
      .from('foods')
      .insert([foodData])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, foodData: any): Promise<Food | null> {
    const { data, error } = await supabase
      .from('foods')
      .update(foodData)
      .eq('food_id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data || null;
  },

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('food_id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }
};

export interface Exercise {
  exercise_id: number;
  name: string;
  category: string;
  default_sets: number;
  default_reps: number;
  description: string;
}

export const ExerciseRepository = {
  async findAll(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async findById(id: number): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('exercise_id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  },

  async create(exerciseData: any): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, exerciseData: any): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .update(exerciseData)
      .eq('exercise_id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data || null;
  },

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('exercise_id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }
};
