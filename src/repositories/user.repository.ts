import { supabase } from '@/lib/supabase';

// Helper to handle Supabase errors or return data
const handleResult = (result: any) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

export interface User {
  user_id: number;
  email: string;
  password_hash: string;
  created_at?: string;
}

export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 is code for "no rows found"
    return data || null;
  },

  async findById(userId: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  },

  async create(email: string, passwordHash: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash }])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },
};
