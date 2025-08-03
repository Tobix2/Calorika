import Dashboard from '@/components/dashboard';
import { getFoods } from '@/services/foodService';
import { getCustomMeals } from '@/services/mealService';

export default async function Home() {
  const foodPromise = getFoods();
  const customMealsPromise = getCustomMeals();

  const [initialFoodDatabase, initialCustomMeals] = await Promise.all([
    foodPromise,
    customMealsPromise,
  ]);

  return (
    <main>
      <Dashboard 
        initialFoodDatabase={initialFoodDatabase}
        initialCustomMeals={initialCustomMeals}
      />
    </main>
  );
}
