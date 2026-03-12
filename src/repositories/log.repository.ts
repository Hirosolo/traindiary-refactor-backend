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

const deleteSessionDetailById = async (sessionDetailId: number, userId?: number): Promise<boolean> => {
  if (userId) {
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);
  }

  const { error } = await supabase
    .from('session_details')
    .delete()
    .eq('session_detail_id', sessionDetailId);

  if (error) throw new Error(error.message);
  return true;
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

const ensureSessionDetailOwnedByUser = async (sessionDetailId: number, userId?: number) => {
  if (!userId) return;

  const { data: detail, error: detailError } = await supabase
    .from('session_details')
    .select('session_id')
    .eq('session_detail_id', sessionDetailId)
    .single();

  if (detailError) throw new Error(detailError.message);

  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('user_id')
    .eq('session_id', detail.session_id)
    .single();

  if (sessionError) throw new Error(sessionError.message);

  if (session.user_id !== userId) {
    throw new Error('UNAUTHORIZED');
  }
};

const ensureSessionOwnedByUser = async (sessionId: number, userId?: number) => {
  if (!userId) return;

  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('user_id')
    .eq('session_id', sessionId)
    .single();

  if (sessionError) throw new Error(sessionError.message);

  if (session.user_id !== userId) {
    throw new Error('UNAUTHORIZED');
  }
};

const getSessionDetailIdBySetId = async (setId: number): Promise<number> => {
  const { data, error } = await supabase
    .from('sessions_exercise_details')
    .select('session_detail_id')
    .eq('set_id', setId)
    .single();

  if (error) throw new Error(error.message);

  return data.session_detail_id as number;
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
    const { data: meal, error: mealError } = await supabase
      .from('user_meals')
      .select('meal_id, meal_type, log_date')
      .eq('meal_id', mealId)
      .eq('user_id', userId)
      .single();

    if (mealError) {
      if (mealError.code === 'PGRST116') {
        throw new Error('Meal not found');
      }
      throw new Error(mealError.message);
    }

    const { data: details, error: detailError } = await supabase
      .from('user_meal_details')
      .select('meal_detail_id, food_id, numbers_of_serving')
      .eq('meal_id', mealId);

    if (detailError) throw new Error(detailError.message);

    const foodIds = Array.from(new Set((details || []).map((d: any) => d.food_id).filter(Boolean)));

    let foodsById = new Map<number, any>();
    if (foodIds.length > 0) {
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select(`
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
        `)
        .in('food_id', foodIds);

      if (foodsError) throw new Error(foodsError.message);
      foodsById = new Map((foods || []).map((f: any) => [f.food_id, f]));
    }

    // Transform to calculate total nutrition per food
    const foods = (details || []).map((detail: any) => {
      const servings = detail.numbers_of_serving || 0;
      const food = foodsById.get(detail.food_id);
      
      return {
        meal_detail_id: detail.meal_detail_id,
        food_id: food?.food_id,
        food_name: food?.name,
        unit_type: food?.serving_type,
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
      meal_id: meal.meal_id,
      meal_type: meal.meal_type,
      log_date: meal.log_date,
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
      numbers_of_serving: d.numbers_of_serving ?? 1
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
  async getExercisesFromPlan(planId: number): Promise<any[]> {
    const { data: days, error: dayError } = await supabase
      .from('plan_days')
      .select('plan_day_id, day_number, day_type')
      .eq('plan_id', planId)
      .order('day_number', { ascending: true })
      .limit(1);

    if (dayError) throw new Error(dayError.message);

    const day = (days || [])[0];
    if (!day) return [];

    const { data: planExercises, error: exError } = await supabase
      .from('plan_day_exercises')
      .select('exercise_id, sets, reps')
      .eq('plan_day_id', day.plan_day_id);

    if (exError) throw new Error(exError.message);

    return (planExercises || []).map((item: any) => ({
      exercise_id: item.exercise_id,
      actual_sets: Number(item.sets || 1),
      actual_reps: Number(item.reps || 0),
      weight_kg: 0,
    }));
  },

  async getPRs(userId: number, exerciseIds: number[]): Promise<Map<number, any>> {
    if (exerciseIds.length === 0) return new Map();
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds);

    if (error) throw new Error(error.message);
    const map = new Map();
    (data || []).forEach(pr => map.set(pr.exercise_id, pr));
    return map;
  },

  async updatePR(userId: number, exerciseId: number, weight: number, reps: number) {
    if (!weight || !reps) return;
    
    // We update PR if weight is higher, or if weight is same but reps are higher
    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    const isNewRecord = !currentPR || 
      weight > currentPR.weight_kg || 
      (weight === currentPR.weight_kg && reps > (currentPR.reps || 0));

    if (isNewRecord) {
      if (currentPR) {
        await supabase
          .from('personal_records')
          .update({ weight_kg: weight, reps: reps, achieved_at: new Date().toISOString() })
          .eq('record_id', currentPR.record_id);
      } else {
        await supabase
          .from('personal_records')
          .insert([{ user_id: userId, exercise_id: exerciseId, weight_kg: weight, reps: reps }]);
      }
    }
  },

  async updateSessionPRsFromMaxSets(sessionId: number, userId: number) {
    const { data: details, error } = await supabase
      .from('session_details')
      .select(`
        exercise_id,
        logs:sessions_exercise_details(weight_kg, reps)
      `)
      .eq('session_id', sessionId);

    if (error) throw new Error(error.message);

    const bestByExercise = new Map<number, { weight: number; reps: number }>();

    (details || []).forEach((detail: any) => {
      const exerciseId = Number(detail.exercise_id || 0);
      if (!exerciseId) return;

      const logs = Array.isArray(detail.logs) ? detail.logs : [];
      logs.forEach((log: any) => {
        const weight = Number(log.weight_kg || 0);
        const reps = Number(log.reps || 0);
        if (weight <= 0) return;

        const existing = bestByExercise.get(exerciseId);
        if (!existing || weight > existing.weight || (weight === existing.weight && reps > existing.reps)) {
          bestByExercise.set(exerciseId, { weight, reps });
        }
      });
    });

    const exerciseIds = Array.from(bestByExercise.keys());
    if (exerciseIds.length === 0) return;

    const { data: currentPRs, error: prError } = await supabase
      .from('personal_records')
      .select('record_id, exercise_id, weight_kg')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds);

    if (prError) throw new Error(prError.message);

    const currentByExercise = new Map<number, any>();
    (currentPRs || []).forEach((row: any) => currentByExercise.set(row.exercise_id, row));

    for (const [exerciseId, best] of bestByExercise.entries()) {
      const current = currentByExercise.get(exerciseId);
      if (!current) {
        const { error: insertError } = await supabase
          .from('personal_records')
          .insert([{ user_id: userId, exercise_id: exerciseId, weight_kg: best.weight, reps: best.reps }]);

        if (insertError) throw new Error(insertError.message);
        continue;
      }

      const currentWeight = Number(current.weight_kg || 0);
      if (best.weight > currentWeight) {
        const { error: updateError } = await supabase
          .from('personal_records')
          .update({
            weight_kg: best.weight,
            reps: best.reps,
            achieved_at: new Date().toISOString(),
          })
          .eq('record_id', current.record_id);

        if (updateError) throw new Error(updateError.message);
      }
    }
  },

  async findByUserId(userId: number, filters: { month?: string, date?: string } = {}): Promise<any[]> {
    let query = supabase
      .from('workout_sessions')
      .select(`
        *,
        session_details:session_details(
          *,
          exercises:exercises(*),
          exercise_logs:sessions_exercise_details(*)
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
    
    const sessions = data || [];
    
    // Fetch PRs for all exercises in these sessions
    const exerciseIds = new Set<number>();
    sessions.forEach((s: any) => s.session_details?.forEach((d: any) => { if (d.exercise_id) exerciseIds.add(d.exercise_id); }));
    const prMap = await this.getPRs(userId, Array.from(exerciseIds));

    // Attach PR to session details
    sessions.forEach((s: any) => s.session_details?.forEach((d: any) => {
      d.personal_record = prMap.get(d.exercise_id) || null;
    }));

    return sessions;
  },

  async create(userId: number, workoutData: any): Promise<any> {
    const { scheduled_date, type, notes, status = 'PENDING', exercises, plan_id } = workoutData;

    let resolvedType = type;
    if (!resolvedType && plan_id) {
      const { data: days } = await supabase
        .from('plan_days')
        .select('day_type')
        .eq('plan_id', plan_id)
        .order('day_number', { ascending: true })
        .limit(1);
      resolvedType = days?.[0]?.day_type || null;
    }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: userId, scheduled_date, type: resolvedType, notes, status }])
      .select()
      .single();
    
    if (sessionError) throw new Error(sessionError.message);

    let resolvedExercises = Array.isArray(exercises) ? exercises : [];
    if (resolvedExercises.length === 0 && plan_id) {
      resolvedExercises = await this.getExercisesFromPlan(Number(plan_id));
    }

    // Group exercises by exercise_id to avoid creating duplicate session_details
    const exerciseMap = new Map<number, any[]>();
    
    for (const ex of resolvedExercises) {
      const exerciseId = Number(ex.exercise_id);
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, []);
      }
      
      // Collect all sets for this exercise
      const sets = ex.sets
        ? ex.sets
        : Array.from({ length: Math.max(Number(ex.actual_sets || 1), 1) }, () => ({
            actual_reps: ex.actual_reps || 0,
            weight_kg: ex.weight_kg || 0,
            duration: ex.duration,
            notes: ex.notes,
            status: ex.status,
          }));
      
      exerciseMap.get(exerciseId)!.push(...sets);
    }

    const exerciseTypeMap = await buildExerciseTypeMap(Array.from(exerciseMap.keys()));
    const prMap = await this.getPRs(userId, Array.from(exerciseMap.keys()));

    // Now create ONE session_detail per unique exercise
    for (const [exerciseId, allSets] of exerciseMap.entries()) {
      const pr = prMap.get(exerciseId);
      const defaultWeight = pr?.weight_kg || 0;
      const defaultReps = pr?.reps || 10;
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
          reps: isCardio ? 0 : (s.actual_reps || s.reps || defaultReps),
          duration: isCardio ? durationMinutes : 0,
          weight_kg: isCardio ? 0 : (s.weight_kg || s.weight || defaultWeight),
          status: s.status ? 'COMPLETED' : 'UNFINISHED',
          notes: s.notes || null
        };
      });

      const { error: logError } = await supabase
        .from('sessions_exercise_details')
        .insert(logInserts);
      
      if (logError) throw new Error(logError.message);
    }

    // If status is COMPLETED, calculate and update GR score and session PRs
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

      await this.updateSessionPRsFromMaxSets(session.session_id, userId);
      
      if (!updateError) return updatedSession;
    }

    return session;
  },

  async updateLog(logId: number, logData: any, userId?: number): Promise<any> {
    const updateData: any = {};
    const sessionDetailId = await getSessionDetailIdBySetId(logId);
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);
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

    // Update PR if completed
    if (updateData.status === 'COMPLETED' || data.status === 'COMPLETED') {
      const { data: detail } = await supabase.from('session_details').select('exercise_id, session_id').eq('session_detail_id', sessionDetailId).single();
      if (detail) {
        const { data: session } = await supabase.from('workout_sessions').select('user_id').eq('session_id', detail.session_id).single();
        if (session) {
          await this.updatePR(session.user_id, detail.exercise_id, data.weight_kg, data.reps);
        }
      }
    }

    return data;
  },

  async createLog(sessionDetailId: number, logData: any, userId?: number): Promise<any> {
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);
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

    // Update PR if completed
    if (status === 'COMPLETED') {
        const { data: detail } = await supabase.from('session_details').select('exercise_id, session_id').eq('session_detail_id', sessionDetailId).single();
        if (detail) {
            const { data: session } = await supabase.from('workout_sessions').select('user_id').eq('session_id', detail.session_id).single();
            if (session) {
                await this.updatePR(session.user_id, detail.exercise_id, data.weight_kg, data.reps);
            }
        }
    }

    return data;
  },

  async getLogsBySessionDetailId(sessionDetailId: number, userId?: number): Promise<any[]> {
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);

    const { data, error } = await supabase
      .from('sessions_exercise_details')
      .select('*')
      .eq('session_detail_id', sessionDetailId)
      .order('set_id', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getLogBySetId(setId: number, userId?: number): Promise<any> {
    const sessionDetailId = await getSessionDetailIdBySetId(setId);
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);

    const { data, error } = await supabase
      .from('sessions_exercise_details')
      .select('*')
      .eq('set_id', setId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteLog(setId: number, userId?: number): Promise<boolean> {
    const sessionDetailId = await getSessionDetailIdBySetId(setId);
    await ensureSessionDetailOwnedByUser(sessionDetailId, userId);

    const { error } = await supabase
      .from('sessions_exercise_details')
      .delete()
      .eq('set_id', setId);

    if (error) throw new Error(error.message);
    return true;
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

    // Calculate GR score and update session PRs when status changes to COMPLETED
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

       await this.updateSessionPRsFromMaxSets(sessionId, userId);
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
  },

  async deleteSessionDetailById(sessionDetailId: number, userId?: number): Promise<boolean> {
    return deleteSessionDetailById(sessionDetailId, userId);
  },

  async upsertLogs(sessionId: number, logs: any[], userId: number): Promise<any[]> {
    if (logs.length === 0) return [];

    // 0. Verify session ownership
    await ensureSessionOwnedByUser(sessionId, userId);

    // 1. Map exercise types for cardio checks
    const exerciseIds = Array.from(new Set(logs.map(log => log.exercise_id).filter(Boolean)));
    const exerciseTypeMap = await buildExerciseTypeMap(exerciseIds.map(id => Number(id)));

    // 2. Resolve session_detail_ids for all logs
    // We need to keep a cache of new session_details created during this batch
    const sessionDetailCache = new Map<number, number>();

    // Get existing session_details for this session
    const { data: existingDetails } = await supabase
      .from('session_details')
      .select('session_detail_id, exercise_id')
      .eq('session_id', sessionId);
    
    (existingDetails || []).forEach(d => {
      sessionDetailCache.set(d.exercise_id, d.session_detail_id);
    });

    // 3. Prepare data and ensure all logs have a valid session_detail_id (creating them if needed)
    const upsertData = [];
    for (const log of logs) {
      let sid = log.session_detail_id ? Number(log.session_detail_id) : NaN;
      
      // If no session_detail_id, try using exercise_id
      if (isNaN(sid) && log.exercise_id) {
        const exId = Number(log.exercise_id);
        if (!sessionDetailCache.has(exId)) {
          // Create new session_detail
          const { data: newDetail, error: detailError } = await supabase
            .from('session_details')
            .insert([{ 
              session_id: sessionId, 
              exercise_id: exId,
              status: 'UNFINISHED'
            }])
            .select('session_detail_id')
            .single();

          if (detailError) throw new Error(detailError.message);
          sessionDetailCache.set(exId, newDetail.session_detail_id);
        }
        sid = sessionDetailCache.get(exId)!;
      }

      // If still NaN and we have a set_id, look it up (sanity check for existing logs)
      if (isNaN(sid) && log.set_id) {
        sid = await getSessionDetailIdBySetId(Number(log.set_id));
        // Verify ownership (though session ownership is already checked, this confirms the set ID belongs to THIS session's detail)
        await ensureSessionDetailOwnedByUser(sid, userId);
      }

      if (isNaN(sid)) {
        throw new Error('INVALID_LOG_PAYLOAD: Missing session_detail_id or exercise_id for new logs');
      }

      const isCardio = normalizeExerciseType(exerciseTypeMap.get(log.exercise_id)) === 'cardio';
      
      let status = 'UNFINISHED';
      if (log.status !== undefined) {
        if (typeof log.status === 'boolean') {
          status = log.status ? 'COMPLETED' : 'UNFINISHED';
        } else {
          status = log.status;
        }
      }

      const durationMinutes = log.duration ?? log.actual_duration ?? (log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0);

      upsertData.push({
        set_id: log.set_id ? Number(log.set_id) : undefined,
        session_detail_id: sid,
        reps: isCardio ? 0 : (log.actual_reps ?? log.reps ?? 0),
        duration: isCardio ? durationMinutes : 0,
        weight_kg: isCardio ? 0 : (log.weight_kg ?? 0),
        status: status,
        notes: log.notes ?? null,
      });
    }

    // 5. Separate new logs from existing logs to avoid PK constraint issues
    const inserts = upsertData.filter(d => d.set_id === undefined).map(({ set_id, ...d }) => d);
    const updates = upsertData.filter(d => d.set_id !== undefined);

    const results = [];

    if (inserts.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('sessions_exercise_details')
        .insert(inserts)
        .select();
      if (insertError) throw new Error(insertError.message);
      if (insertData) results.push(...insertData);
    }

    if (updates.length > 0) {
      const { data: updateData, error: updateError } = await supabase
        .from('sessions_exercise_details')
        .upsert(updates)
        .select();
      if (updateError) throw new Error(updateError.message);
      if (updateData) results.push(...updateData);
    }

    // Update PRs for all completed logs in this batch
    const completedLogs = results.filter(r => r.status === 'COMPLETED');
    if (completedLogs.length > 0) {
        const detailIds = Array.from(new Set(completedLogs.map(l => l.session_detail_id)));
        const { data: details } = await supabase.from('session_details').select('session_detail_id, exercise_id').in('session_detail_id', detailIds);
        const detailToEx = new Map(details?.map(d => [d.session_detail_id, d.exercise_id]));
        
        for (const log of completedLogs) {
            const exId = detailToEx.get(log.session_detail_id);
            if (exId) {
                await this.updatePR(userId, exId, log.weight_kg, log.reps);
            }
        }
    }

    return results;
  }
};
