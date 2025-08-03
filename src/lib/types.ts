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
};

export type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export type Meal = {
  name: MealName;
  items: MealItem[];
};

export type CustomMeal = {
  id: string;
  name: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
};
