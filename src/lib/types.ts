export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving: string;
};

export type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export type Meal = {
  name: MealName;
  items: FoodItem[];
};

export type CustomMeal = {
  id: string;
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
};
