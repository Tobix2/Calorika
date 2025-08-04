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

export type CustomMeal = {
  id: string;
  name: string;
  items: MealItem[]; // Can be empty for meals with manual totals
  // Nutritional info per serving for manually entered meals
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
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
