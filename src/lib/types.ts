

export type FoodItem = {
  id: string;
  name: string;
  calories: number; // por servingSize
  protein: number; // por servingSize
  carbs: number; // por servingSize
  fats: number; // por servingSize
  servingSize: number;
  servingUnit: string;
};

export type MealItem = FoodItem & {
  // id en la instancia de la comida, diferente al id del FoodItem
  mealItemId: string; 
  quantity: number;
  isCustom?: boolean; // Flag for manually added meals
};

export type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export type Meal = {
  name: MealName;
  items: MealItem[];
};

export type DailyPlan = Meal[];

export type WeeklyPlan = {
  [date: string]: DailyPlan; // La clave es YYYY-MM-DD
};

export type CustomMeal = {
  id: string;
  name: string;
  items: MealItem[]; // Puede estar vacío para comidas con totales manuales
  // Información nutricional por ración para comidas introducidas manualmente
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  servingSize: number;
  servingUnit: string;
};

export type GenerateMealPlanInput = {
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
    availableFoods: FoodItem[];
    availableMeals: CustomMeal[];
};

export type GenerateMealPlanOutput = Meal[];

export type WeeklyWeightEntry = {
  id: string;
  date: string; // ISO 8601 format, represents start of the week
  weight: number; // in kg
};

    