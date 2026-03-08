export interface CalculationMetrics {
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  goal_type: 'cutting' | 'lean_bulk' | 'maintain' | 'recomposition';
  goal_speed: 'slow' | 'moderate' | 'aggressive';
  workout_days_per_week?: number;
}

export interface CalculationResult {
  bmr: number;
  tdee: number;
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  hydration_ml: number;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
};

const CALORIE_ADJUSTMENTS = {
  cutting: {
    slow: -250,
    moderate: -500,
    aggressive: -750,
  },
  lean_bulk: {
    slow: 200,
    moderate: 350,
    aggressive: 500,
  },
  maintain: {
    slow: 0,
    moderate: 0,
    aggressive: 0,
  },
  recomposition: {
    slow: -100,
    moderate: -200,
    aggressive: -300,
  }
};

export const NutritionService = {
  calculateGoal(metrics: CalculationMetrics): CalculationResult {
    const { age, sex, height_cm, weight_kg, activity_level, goal_type, goal_speed, workout_days_per_week = 0 } = metrics;

    // 1. BMR Calculation (Mifflin-St Jeor)
    let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
    if (sex === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // 2. TDEE Calculation
    const multiplier = ACTIVITY_MULTIPLIERS[activity_level];
    const tdee = bmr * multiplier;

    // 3. Goal Calorie Calculation
    const adjustment = CALORIE_ADJUSTMENTS[goal_type][goal_speed];
    const daily_calories = Math.round(tdee + adjustment);

    // 4. Protein Calculation
    let protein_per_kg = 1.8;
    if (goal_type === 'cutting') protein_per_kg = 2.2;
    else if (goal_type === 'maintain') protein_per_kg = 1.6;
    
    const protein_g = Math.round(weight_kg * protein_per_kg);
    const protein_kcal = protein_g * 4;

    // 5. Fat Calculation
    const fat_g = Math.round(weight_kg * 0.8);
    const fat_kcal = fat_g * 9;

    // 6. Carbohydrate Calculation
    const remaining_kcal = daily_calories - (protein_kcal + fat_kcal);
    const carbs_g = Math.round(Math.max(0, remaining_kcal / 4));

    // 7. Hydration Calculation
    // Base: 35ml per kg
    // Workout: +500ml per hour (approx 1 hr per workout day spread over week is roughly workout_days * 500 / 7)
    // But spec says +500ml per hour of exercise. Let's assume daily target includes average workout duration.
    const base_hydration = weight_kg * 35;
    const workout_avg_daily_hydration = (workout_days_per_week * 500) / 7;
    const hydration_ml = Math.round(base_hydration + workout_avg_daily_hydration);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      daily_calories,
      protein_g,
      fat_g,
      carbs_g,
      hydration_ml,
    };
  }
};
