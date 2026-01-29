import { supabase } from '@/lib/supabase';

export const MealRepository = {
  async findByUserId(userId: number, filters: { month?: string, date?: string } = {}): Promise<any[]> {
    let query = supabase
      .from('user_meals')
      .select(`
        *,
        details:user_meal_details(
          *,
          food:foods(*)
        )
      `)
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (filters.date) {
      query = query.eq('log_date', filters.date);
    } else if (filters.month) {
      // YYYY-MM
      const [year, month] = filters.month.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(Number(year), Number(month), 1).toISOString().split('T')[0];
      query = query.gte('log_date', startDate).lt('log_date', endDate);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(userId: number, mealData: any): Promise<any> {
    const { meal_type, log_date, details } = mealData;
    
    // Create the meal
    const { data: meal, error: mealError } = await supabase
      .from('user_meals')
      .insert([{ user_id: userId, meal_type, log_date }])
      .select()
      .single();
    
    if (mealError) throw new Error(mealError.message);

    // Create meal details
    const mealDetails = details.map((d: any) => ({
      meal_id: meal.meal_id,
      food_id: d.food_id,
      amount_grams: d.amount_grams
    }));

    const { error: detailsError } = await supabase
      .from('user_meal_details')
      .insert(mealDetails);
    
    if (detailsError) throw new Error(detailsError.message);

    return meal;
  },

  async delete(mealId: number, userId: number): Promise<boolean> {
    const { error } = await supabase
      .from('user_meals')
      .delete()
      .eq('meal_id', mealId)
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    return true;
  }
};

export const WorkoutRepository = {
  async findByUserId(userId: number, filters: { month?: string, date?: string } = {}): Promise<any[]> {
    let query = supabase
      .from('workout_sessions')
      .select(`
        *,
        details:session_details(
          *,
          exercise:exercises(*),
          logs:sessions_exercise_details(*)
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false });

    if (filters.date) {
      query = query.eq('scheduled_date', filters.date);
    } else if (filters.month) {
      // YYYY-MM
      const [yearStr, monthStr] = filters.month.split('-');
      const y = Number(yearStr);
      const m = Number(monthStr);
      
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      
      let nextY = y;
      let nextM = m + 1;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
      
      query = query.gte('scheduled_date', startDate).lt('scheduled_date', endDate);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(userId: number, workoutData: any): Promise<any> {
    const { scheduled_date, type, notes, status = 'PENDING', exercises } = workoutData;

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: userId, scheduled_date, type, notes, status }])
      .select()
      .single();
    
    if (sessionError) throw new Error(sessionError.message);

    // Group exercises by exercise_id to avoid creating duplicate session_details
    const exerciseMap = new Map<number, any[]>();
    
    for (const ex of exercises) {
      const exerciseId = Number(ex.exercise_id);
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, []);
      }
      
      // Collect all sets for this exercise
      const sets = ex.sets || [{
        actual_sets: ex.actual_sets || 1,
        actual_reps: ex.actual_reps || 0,
        weight_kg: ex.weight_kg || 0,
        notes: ex.notes
      }];
      
      exerciseMap.get(exerciseId)!.push(...sets);
    }

    // Now create ONE session_detail per unique exercise
    for (const [exerciseId, allSets] of exerciseMap.entries()) {
      const { data: detail, error: detailError } = await supabase
        .from('session_details')
        .insert([{ 
          session_id: session.session_id, 
          exercise_id: exerciseId,
          status: 'UNFINISHED'
        }])
        .select()
        .single();
      
      if (detailError) throw new Error(detailError.message);

      // Create all sets for this exercise
      const logInserts = allSets.map((s: any) => ({
          session_detail_id: detail.session_detail_id,
          reps: s.actual_reps || s.reps || 0,
          weight_kg: s.weight_kg || s.weight || 0,
          status: s.status ? 'COMPLETED' : 'UNFINISHED',
          notes: s.notes || null
      }));

      const { error: logError } = await supabase
        .from('sessions_exercise_details')
        .insert(logInserts);
      
      if (logError) throw new Error(logError.message);
    }

    return session;
  },

  async updateLog(logId: number, logData: any): Promise<any> {
    const updateData: any = {};
    
    if (logData.actual_reps !== undefined || logData.reps !== undefined) {
      updateData.reps = logData.actual_reps ?? logData.reps;
    }
    if (logData.weight_kg !== undefined) {
      updateData.weight_kg = logData.weight_kg;
    }
    if (logData.notes !== undefined) {
      updateData.notes = logData.notes;
    }
    if (logData.status !== undefined) {
      // If status is boolean, convert to correct string
      if (typeof logData.status === 'boolean') {
        updateData.status = logData.status ? 'COMPLETED' : 'UNFINISHED';
      } else {
        updateData.status = logData.status;
      }
    }

    const { data, error } = await supabase
      .from('sessions_exercise_details')
      .update(updateData)
      .eq('set_id', logId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Check if we should update the parent session_detail status
    if (data.session_detail_id) {
        const { data: siblingLogs } = await supabase
            .from('sessions_exercise_details')
            .select('status')
            .eq('session_detail_id', data.session_detail_id);
        
        if (siblingLogs) {
            const allCompleted = siblingLogs.every((l: any) => l.status === 'COMPLETED');
            const newStatus = allCompleted ? 'COMPLETED' : 'UNFINISHED';
            
            await supabase
                .from('session_details')
                .update({ status: newStatus })
                .eq('session_detail_id', data.session_detail_id);
        }
    }

    return data;
  },

  async createLog(sessionDetailId: number, logData: any): Promise<any> {
    // Ensure required fields have defaults
    let status = 'UNFINISHED';
    if (logData.status !== undefined) {
        if (typeof logData.status === 'boolean') {
            status = logData.status ? 'COMPLETED' : 'UNFINISHED';
        } else {
            status = logData.status;
        }
    }

    const insertData = {
      session_detail_id: sessionDetailId,
      reps: logData.actual_reps || logData.reps || 0,
      weight_kg: logData.weight_kg || 0,
      status: status,
      notes: logData.notes || null
    };
    
    const { data, error } = await supabase
      .from('sessions_exercise_details')
      .insert([insertData])
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update parent status (usually creating a new set means exercise is unfinished unless explicitly completed)
    const { data: siblingLogs } = await supabase
        .from('sessions_exercise_details')
        .select('status')
        .eq('session_detail_id', sessionDetailId);
    
    if (siblingLogs) {
        const allCompleted = siblingLogs.every((l: any) => l.status === 'COMPLETED');
        const newStatus = allCompleted ? 'COMPLETED' : 'UNFINISHED';
        await supabase
            .from('session_details')
            .update({ status: newStatus })
            .eq('session_detail_id', sessionDetailId);
    }

    return data;
  },

  async updateSession(sessionId: number, userId: number, sessionData: any): Promise<any> {
     const updateData: any = {};
     
     if (sessionData.notes !== undefined) updateData.notes = sessionData.notes;
     if (sessionData.type !== undefined) updateData.type = sessionData.type;
     if (sessionData.scheduled_date !== undefined) updateData.scheduled_date = sessionData.scheduled_date;
     
     // Handle status/completed mapping
     if (sessionData.status !== undefined) {
         updateData.status = sessionData.status;
     } else if (sessionData.completed !== undefined) {
         updateData.status = sessionData.completed ? 'COMPLETED' : 'IN_PROGRESS';
     }

     const { data, error } = await supabase
      .from('workout_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(sessionId: number, userId: number): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    return true;
  }
};
