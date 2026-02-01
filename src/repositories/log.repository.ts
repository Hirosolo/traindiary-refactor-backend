import { supabase } from '@/lib/supabase';

const normalizeExerciseType = (type?: string | null) => (type || '').toLowerCase();

const buildExerciseTypeMap = async (exerciseIds: number[]) => {
  if (exerciseIds.length === 0) return new Map<number, string>();
  const { data, error } = await supabase
    .from('exercises')
    .select('exercise_id, type')
    .in('exercise_id', exerciseIds);

  if (error) throw new Error(error.message);

  const map = new Map<number, string>();
  (data || []).forEach((row: any) => {
    map.set(row.exercise_id, row.type);
  });
  return map;
};

const isCardioBySessionDetailId = async (sessionDetailId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('session_details')
    .select('exercise_id, session_id')
    .eq('session_detail_id', sessionDetailId)
    .single();

  if (error) throw new Error(error.message);
  
  const exerciseId = data?.exercise_id;
  if (!exerciseId) return false;
  
  const { data: exercise, error: exError } = await supabase
    .from('exercises')
    .select('type')
    .eq('exercise_id', exerciseId)
    .single();
  
  if (exError) throw new Error(exError.message);
  return normalizeExerciseType(exercise?.type as string | undefined) === 'cardio';
};

const isCardioByLogId = async (logId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('sessions_exercise_details')
    .select('session_detail_id')
    .eq('set_id', logId)
    .single();

  if (error) throw new Error(error.message);
  
  return isCardioBySessionDetailId(data?.session_detail_id as number);
};

export const MealRepository = {
  async findByUserId(userId: number, filters: { month?: string, date?: string } = {}): Promise<any[]> {
    let query = supabase
      .from('user_meals')
      .select(`
        meal_id,
        meal_type,
        log_date,
        details:user_meal_details(
          numbers_of_serving,
          food:foods(
            calories_per_serving,
            protein_per_serving,
            carbs_per_serving,
            fat_per_serving,
            fibers_per_serving,
            sugars_per_serving,
            zincs_per_serving,
            magnesiums_per_serving,
            calciums_per_serving,
            irons_per_serving,
            vitamin_a_per_serving,
            vitamin_c_per_serving,
            vitamin_b12_per_serving,
            vitamin_d_per_serving
          )
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
    
    // Transform data to calculate total nutrition per meal
    const meals = (data || []).map((meal: any) => {
      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fibers: 0,
        sugars: 0,
        zincs: 0,
        magnesiums: 0,
        calciums: 0,
        irons: 0,
        vitamin_a: 0,
        vitamin_c: 0,
        vitamin_b12: 0,
        vitamin_d: 0,
      };

      // Sum up nutrition from all foods in the meal
      if (meal.details && Array.isArray(meal.details)) {
        meal.details.forEach((detail: any) => {
          const servings = detail.numbers_of_serving || 0;
          const food = detail.food;
          
          if (food) {
            totals.calories += (food.calories_per_serving || 0) * servings;
            totals.protein += (food.protein_per_serving || 0) * servings;
            totals.carbs += (food.carbs_per_serving || 0) * servings;
            totals.fat += (food.fat_per_serving || 0) * servings;
            totals.fibers += (food.fibers_per_serving || 0) * servings;
            totals.sugars += (food.sugars_per_serving || 0) * servings;
            totals.zincs += (food.zincs_per_serving || 0) * servings;
            totals.magnesiums += (food.magnesiums_per_serving || 0) * servings;
            totals.calciums += (food.calciums_per_serving || 0) * servings;
            totals.irons += (food.irons_per_serving || 0) * servings;
            totals.vitamin_a += (food.vitamin_a_per_serving || 0) * servings;
            totals.vitamin_c += (food.vitamin_c_per_serving || 0) * servings;
            totals.vitamin_b12 += (food.vitamin_b12_per_serving || 0) * servings;
            totals.vitamin_d += (food.vitamin_d_per_serving || 0) * servings;
          }
        });
      }

      // Return meal with aggregated nutrition values
      return {
        meal_id: meal.meal_id,
        meal_type: meal.meal_type,
        log_date: meal.log_date,
        total_calories: Math.round(totals.calories * 100) / 100,
        total_protein: Math.round(totals.protein * 100) / 100,
        total_carbs: Math.round(totals.carbs * 100) / 100,
        total_fat: Math.round(totals.fat * 100) / 100,
        total_fibers: Math.round(totals.fibers * 100) / 100,
        total_sugars: Math.round(totals.sugars * 100) / 100,
        total_zincs: Math.round(totals.zincs * 100) / 100,
        total_magnesiums: Math.round(totals.magnesiums * 100) / 100,
        total_calciums: Math.round(totals.calciums * 100) / 100,
        total_irons: Math.round(totals.irons * 100) / 100,
        total_vitamin_a: Math.round(totals.vitamin_a * 100) / 100,
        total_vitamin_c: Math.round(totals.vitamin_c * 100) / 100,
        total_vitamin_b12: Math.round(totals.vitamin_b12 * 100) / 100,
        total_vitamin_d: Math.round(totals.vitamin_d * 100) / 100,
      };
    });

    return meals;
  },

  async findById(mealId: number, userId: number): Promise<any> {
    const { data, error } = await supabase
      .from('user_meals')
      .select(`
        meal_id,
        meal_type,
        log_date,
        details:user_meal_details(
          meal_detail_id,
          numbers_of_serving,
          food:foods(
            food_id,
            name,
            serving_type,
            image,
            calories_per_serving,
            protein_per_serving,
            carbs_per_serving,
            fat_per_serving,
            fibers_per_serving,
            sugars_per_serving,
            zincs_per_serving,
            magnesiums_per_serving,
            calciums_per_serving,
            irons_per_serving,
            vitamin_a_per_serving,
            vitamin_c_per_serving,
            vitamin_b12_per_serving,
            vitamin_d_per_serving
          )
        )
      `)
      .eq('meal_id', mealId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Meal not found');
      }
      throw new Error(error.message);
    }

    // Transform to calculate total nutrition per food
    const foods = (data.details || []).map((detail: any) => {
      const servings = detail.numbers_of_serving || 0;
      const food = detail.food;
      
      return {
        meal_detail_id: detail.meal_detail_id,
        food_id: food?.food_id,
        food_name: food?.name,
        serving_type: food?.serving_type,
        image: food?.image,
        numbers_of_serving: servings,
        total_calories: Math.round((food?.calories_per_serving || 0) * servings * 100) / 100,
        total_protein: Math.round((food?.protein_per_serving || 0) * servings * 100) / 100,
        total_carbs: Math.round((food?.carbs_per_serving || 0) * servings * 100) / 100,
        total_fat: Math.round((food?.fat_per_serving || 0) * servings * 100) / 100,
        total_fibers: Math.round((food?.fibers_per_serving || 0) * servings * 100) / 100,
        total_sugars: Math.round((food?.sugars_per_serving || 0) * servings * 100) / 100,
        total_zincs: Math.round((food?.zincs_per_serving || 0) * servings * 100) / 100,
        total_magnesiums: Math.round((food?.magnesiums_per_serving || 0) * servings * 100) / 100,
        total_calciums: Math.round((food?.calciums_per_serving || 0) * servings * 100) / 100,
        total_irons: Math.round((food?.irons_per_serving || 0) * servings * 100) / 100,
        total_vitamin_a: Math.round((food?.vitamin_a_per_serving || 0) * servings * 100) / 100,
        total_vitamin_c: Math.round((food?.vitamin_c_per_serving || 0) * servings * 100) / 100,
        total_vitamin_b12: Math.round((food?.vitamin_b12_per_serving || 0) * servings * 100) / 100,
        total_vitamin_d: Math.round((food?.vitamin_d_per_serving || 0) * servings * 100) / 100,
      };
    });

    return {
      meal_id: data.meal_id,
      meal_type: data.meal_type,
      log_date: data.log_date,
      foods,
    };
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
      numbers_of_serving: d.amount_grams || d.numbers_of_serving
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

    const datePart = (scheduled_date || '').toString().split(/[T ]/)[0];
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!datePart || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      throw new Error('Invalid scheduled_date');
    }

    const startDate = `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
    const nextDate = new Date(year, month - 1, day + 1);
    const endDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

    const { data: existingSessions, error: existingError } = await supabase
      .from('workout_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .gte('scheduled_date', startDate)
      .lt('scheduled_date', endDate)
      .limit(1);

    if (existingError) throw new Error(existingError.message);
    if (existingSessions && existingSessions.length > 0) {
      throw new Error('WORKOUT_SESSION_ALREADY_EXISTS');
    }

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

    const exerciseTypeMap = await buildExerciseTypeMap(Array.from(exerciseMap.keys()));

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
      const isCardio = normalizeExerciseType(exerciseTypeMap.get(exerciseId)) === 'cardio';
      const logInserts = allSets.map((s: any) => {
        const durationMinutes = s.duration ?? (s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0);
        return {
          session_detail_id: detail.session_detail_id,
          reps: isCardio ? 0 : (s.actual_reps || s.reps || 0),
          duration: isCardio ? durationMinutes : 0,
          weight_kg: isCardio ? 0 : (s.weight_kg || s.weight || 0),
          status: s.status ? 'COMPLETED' : 'UNFINISHED',
          notes: s.notes || null
        };
      });

      const { error: logError } = await supabase
        .from('sessions_exercise_details')
        .insert(logInserts);
      
      if (logError) throw new Error(logError.message);
    }

    // If status is COMPLETED, calculate and update GR score
    if (status === 'COMPLETED') {
      const { data: sessionDetails } = await supabase
        .from('session_details')
        .select(`
          session_detail_id,
          exercise:exercises(difficulty_factor),
          logs:sessions_exercise_details(reps, weight_kg)
        `)
        .eq('session_id', session.session_id);

      let totalGrScore = 0;
      if (sessionDetails) {
        sessionDetails.forEach((detail: any) => {
          const difficulty = detail.exercise?.difficulty_factor || 1.0;
          detail.logs?.forEach((log: any) => {
            const reps = log.reps || 0;
            const weight = log.weight_kg || 0;
            totalGrScore += reps * weight * difficulty;
          });
        });
      }

      const { data: updatedSession, error: updateError } = await supabase
        .from('workout_sessions')
        .update({ gr_score: Math.round(totalGrScore) })
        .eq('session_id', session.session_id)
        .select()
        .single();
      
      if (!updateError) return updatedSession;
    }

    return session;
  },

  async updateLog(logId: number, logData: any): Promise<any> {
    const updateData: any = {};
    const isCardio = await isCardioByLogId(logId);

    if (!isCardio && (logData.actual_reps !== undefined || logData.reps !== undefined)) {
      updateData.reps = logData.actual_reps ?? logData.reps;
    }
    if (isCardio && (logData.duration !== undefined || logData.actual_duration !== undefined || logData.duration_seconds !== undefined)) {
      const durationMinutes = logData.duration ?? logData.actual_duration ?? (logData.duration_seconds ? Math.round(logData.duration_seconds / 60) : undefined);
      if (durationMinutes !== undefined) updateData.duration = durationMinutes;
    }
    if (!isCardio && logData.weight_kg !== undefined) {
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

    return data;
  },

  async createLog(sessionDetailId: number, logData: any): Promise<any> {
    const isCardio = await isCardioBySessionDetailId(sessionDetailId);
    // Ensure required fields have defaults
    let status = 'UNFINISHED';
    if (logData.status !== undefined) {
        if (typeof logData.status === 'boolean') {
            status = logData.status ? 'COMPLETED' : 'UNFINISHED';
        } else {
            status = logData.status;
        }
    }

    const durationMinutes = logData.duration ?? logData.actual_duration ?? (logData.duration_seconds ? Math.round(logData.duration_seconds / 60) : 0);
    const insertData = {
      session_detail_id: sessionDetailId,
      reps: isCardio ? 0 : (logData.actual_reps || logData.reps || 0),
      duration: isCardio ? durationMinutes : 0,
      weight_kg: isCardio ? 0 : (logData.weight_kg || 0),
      status: status,
      notes: logData.notes || null
    };
    
    const { data, error } = await supabase
      .from('sessions_exercise_details')
      .insert([insertData])
      .select()
      .single();
    if (error) throw new Error(error.message);

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

     // Calculate GR score when status changes to COMPLETED
     if (updateData.status === 'COMPLETED') {
       const { data: sessionDetails } = await supabase
         .from('session_details')
         .select(`
           session_detail_id,
           exercise:exercises(difficulty_factor),
           logs:sessions_exercise_details(reps, weight_kg)
         `)
         .eq('session_id', sessionId);

       let totalGrScore = 0;
       if (sessionDetails) {
         sessionDetails.forEach((detail: any) => {
           const difficulty = detail.exercise?.difficulty_factor || 1.0;
           detail.logs?.forEach((log: any) => {
             const reps = log.reps || 0;
             const weight = log.weight_kg || 0;
             totalGrScore += reps * weight * difficulty;
           });
         });
       }
       updateData.gr_score = Math.round(totalGrScore);
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
