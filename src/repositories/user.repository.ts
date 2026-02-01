import { supabase } from '@/lib/supabase';

// Helper to handle Supabase errors or return data
const handleResult = (result: any) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

export interface User {
  user_id: number;
  email: string;
  username: string;
  phone_number: string;
  password_hash: string;
  verified?: boolean;
  verification_code?: string | null;
  verification_token?: string | null;
  verification_expires_at?: string | null;
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

  async create(userData: { email: string; passwordHash: string; fullname: string; phone: string; verified?: boolean; verificationCode?: string; verificationToken?: string; verificationExpiresAt?: string }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email: userData.email, 
        password_hash: userData.passwordHash,
        username: userData.fullname,
        phone_number: userData.phone,
        verified: userData.verified ?? false,
        verification_code: userData.verificationCode ?? null,
        verification_token: userData.verificationToken ?? null,
        verification_expires_at: userData.verificationExpiresAt ?? null,
      }])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async findByVerificationToken(token: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  },

  async findByVerificationCode(code: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  },

  async verifyUser(userId: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        verified: true,
        verification_code: null,
        verification_token: null,
        verification_expires_at: null,
      })
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async deleteById(userId: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async deleteUnverifiedExpired(nowIso: string): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('verified', false)
      .lt('verification_expires_at', nowIso)
      .select('user_id');

    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  },
};
