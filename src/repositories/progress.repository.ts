import { supabase } from '@/lib/supabase';

export const ProgressRepository = {
  async getSummary(userId: number, period: 'weekly' | 'monthly', explicitStartDate?: string): Promise<any> {
    let startDateStr = explicitStartDate;
    
    if (!startDateStr) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === 'weekly' ? 7 : 30));
      startDateStr = startDate.toISOString().split('T')[0];
    }

    // Calculate end date for current period
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    if (period === 'monthly') {
      // Set to 1st of next month
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(1);
    } else {
      endDate.setDate(endDate.getDate() + 7);
    }
    const endDateStr = endDate.toISOString().split('T')[0];

    // Calculate previous period dates for comparison
    const prevStartDate = new Date(startDate);
    if (period === 'monthly') {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      prevStartDate.setDate(1);
    } else {
      prevStartDate.setDate(prevStartDate.getDate() - 7);
    }
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];

    // Get workouts in current period
    const { data: workouts, error: workoutError } = await supabase
      .from('workout_sessions')
      .select(`
        session_id,
        scheduled_date,
        status,
        gr_score,
        details:session_details(
          logs:sessions_exercise_details(reps, weight_kg),
          exercise:exercises(category, difficulty_factor)
        )
      `)
      .eq('user_id', userId)
      .gte('scheduled_date', startDateStr)
      .lt('scheduled_date', endDateStr)
      .order('scheduled_date', { ascending: true });

    if (workoutError) throw new Error(workoutError.message);

    // Get workouts from previous period for comparison
    const { data: prevWorkouts } = await supabase
      .from('workout_sessions')
      .select('gr_score, status')
      .eq('user_id', userId)
      .gte('scheduled_date', prevStartDateStr)
      .lt('scheduled_date', startDateStr)
      .eq('status', 'COMPLETED');

    // Calculate longest continuous streak within the current period
    const completedWorkouts = workouts?.filter(w => w.status === 'COMPLETED') || [];
    const uniqueDates = Array.from(new Set(completedWorkouts.map(w => w.scheduled_date))).sort();

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    uniqueDates.forEach((dateStr: string) => {
      const workoutDate = new Date(dateStr);
      
      if (lastDate) {
        const daysDiff = Math.floor((workoutDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      lastDate = workoutDate;
    });
    longestStreak = Math.max(longestStreak, currentStreak);

    // Get meals in the period
    const { data: meals, error: mealError } = await supabase
      .from('user_meals')
      .select(`
        meal_id,
        details:user_meal_details(
          numbers_of_serving,
          food:foods(calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fibers_per_serving)
        )
      `)
      .eq('user_id', userId)
      .gte('log_date', startDateStr)
      .lt('log_date', endDateStr);

    if (mealError) throw new Error(mealError.message);

    // Calculate averages based on period days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Calculate total volume and gr_score
    let totalGrScore = 0;
    let totalVolume = 0;
    const muscleGroups: Record<string, number> = {};

    workouts?.forEach(w => {
      if (w.status === 'COMPLETED') {
        if (w.gr_score) {
          totalGrScore += w.gr_score;
        }
        
        w.details?.forEach((d: any) => {
          const category = d.exercise?.category || 'Other';
          const difficulty = d.exercise?.difficulty_factor || 1.0;
          
          let detailForce = 0;
          d.logs?.forEach((l: any) => {
            const reps = l.reps || 0;
            const weight = l.weight_kg || 0;
            const effectiveWeight = weight > 0 ? weight : 1;
            const volume = reps * effectiveWeight;
            totalVolume += volume;
            detailForce += volume * difficulty;
          });

          muscleGroups[category] = (muscleGroups[category] || 0) + detailForce;
        });
      }
    });

    // Calculate previous period GR score
    let prevGrScore = 0;
    prevWorkouts?.forEach((w: any) => {
      if (w.gr_score) {
        prevGrScore += w.gr_score;
      }
    });

    // Calculate GR score change percentage
    let grScoreChange = 0;
    if (prevGrScore > 0) {
      grScoreChange = Math.round(((totalGrScore - prevGrScore) / prevGrScore) * 100);
    }

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
        const servings = d.numbers_of_serving || 0;
        totalCalories += (food.calories_per_serving || 0) * servings;
        totalProtein += (food.protein_per_serving || 0) * servings;
        totalCarbs += (food.carbs_per_serving || 0) * servings;
        totalFat += (food.fat_per_serving || 0) * servings;
        totalFiber += (food.fibers_per_serving || 0) * servings;
      });
    });

    return {
      total_workouts: workouts?.filter((w: any) => w.status === 'COMPLETED').length || 0,
      total_volume: Math.round(totalVolume),
      gr_score: Math.round(totalGrScore),
      gr_score_change: grScoreChange,
      longest_streak: longestStreak,
      muscle_split: muscleSplit,
      calories_avg: Math.round(totalCalories / diffDays),
      protein_avg: Math.round(totalProtein / diffDays),
      carbs_avg: Math.round(totalCarbs / diffDays),
      fats_avg: Math.round(totalFat / diffDays),
      fiber_avg: Math.round(totalFiber / diffDays)
    };
  }
};
