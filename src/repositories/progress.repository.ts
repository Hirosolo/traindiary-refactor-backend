import { supabase } from '@/lib/supabase';

export const ProgressRepository = {
  async getSummary(userId: number, period: 'weekly' | 'monthly', explicitStartDate?: string): Promise<any> {
    let startDateStr = explicitStartDate;
    
    if (!startDateStr) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === 'weekly' ? 7 : 30));
      startDateStr = startDate.toISOString().split('T')[0];
    }

    // Get workouts in the period
    const { data: workouts, error: workoutError } = await supabase
      .from('workout_sessions')
      .select(`
        session_id,
        details:session_details(
          logs:sessions_exercise_details(reps, weight_kg),
          exercise:exercises(category, difficulty_factor)
        )
      `)
      .eq('user_id', userId)
      .gte('scheduled_date', startDateStr);

    if (workoutError) throw new Error(workoutError.message);

    // Get meals in the period
    const { data: meals, error: mealError } = await supabase
      .from('user_meals')
      .select(`
        meal_id,
        details:user_meal_details(
          amount_grams,
          food:foods(calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving)
        )
      `)
      .eq('user_id', userId)
      .gte('log_date', startDateStr);

    if (mealError) throw new Error(mealError.message);

    // Calculate totals manually
    let totalVolume = 0;
    let totalGrScore = 0;
    const muscleGroups: Record<string, number> = {};

    workouts?.forEach(w => {
      w.details?.forEach((d: any) => {
        const difficulty = d.exercise?.difficulty_factor || 1.0;
        const category = d.exercise?.category || 'Other';
        
        let detailForce = 0;
        d.logs?.forEach((l: any) => {
          const reps = l.reps || 0;
          const weight = l.weight_kg || 0;
          
          const volume = reps * weight;
          totalVolume += volume;
          
          const gr = reps * weight * difficulty;
          totalGrScore += gr;
          detailForce += gr;
        });

        // Add to muscle split
        muscleGroups[category] = (muscleGroups[category] || 0) + detailForce;
      });
    });

    // Normalize muscle split to percentages
    const totalForce = Object.values(muscleGroups).reduce((a, b) => a + b, 0);
    const muscleSplit = Object.entries(muscleGroups).map(([name, value]) => ({
      name,
      value: totalForce > 0 ? Math.round((value / totalForce) * 100) : 0
    })).filter(m => m.value > 0);

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    meals?.forEach(m => {
      m.details?.forEach((d: any) => {
        const food = d.food;
        const amount = d.amount_grams || 0;
        totalCalories += (food.calories_per_serving || 0) * amount;
        totalProtein += (food.protein_per_serving || 0) * amount;
        totalCarbs += (food.carbs_per_serving || 0) * amount;
        totalFat += (food.fat_per_serving || 0) * amount;
        totalFiber += (food.fibers_per_serving || 0) * amount;
      });
    });

    return {
      total_workouts: workouts?.length || 0,
      total_volume: Math.round(totalVolume),
      gr_score: Math.round(totalGrScore),
      muscle_split: muscleSplit,
      total_meals: meals?.length || 0,
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein),
      total_carbs: Math.round(totalCarbs),
      total_fat: Math.round(totalFat),
      total_fiber: Math.round(totalFiber)
    };
  }
};
