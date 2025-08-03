
"use client";

import { useState, useMemo } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';

const initialMeals: Meal[] = [
  { name: 'Breakfast', items: [] },
  { name: 'Lunch', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [calorieGoal, setCalorieGoal] = useState<number>(2200);
  const [proteinGoal, setProteinGoal] = useState<number>(140);
  const [carbsGoal, setCarbsGoal] = useState<number>(250);
  const [fatsGoal, setFatsGoal] = useState<number>(70);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  
  const handleAddFood = (mealName: MealName, food: FoodItem) => {
    setMeals(prevMeals =>
      prevMeals.map(meal => {
        if (meal.name === mealName) {
            const newItem: MealItem = {
                ...food,
                mealItemId: crypto.randomUUID(),
                quantity: food.servingSize
            };
            return { ...meal, items: [...meal.items, newItem] };
        }
        return meal;
      })
    );
  };

  const handleAddCustomMeal = (mealName: MealName, customMeal: CustomMeal) => {
    setMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.name === mealName ? { ...meal, items: [...meal.items, ...customMeal.items.map(item => ({...item, mealItemId: crypto.randomUUID()}))] } : meal
      )
    );
  };

  const handleRemoveFood = (mealName: MealName, mealItemId: string) => {
    setMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.name === mealName
          ? { ...meal, items: meal.items.filter(item => item.mealItemId !== mealItemId) }
          : meal
      )
    );
  };

  const handleSetGoal = (output: CalorieRecommendationOutput) => {
    setCalorieGoal(output.recommendedCalories);
    setProteinGoal(output.recommendedProtein);
    setCarbsGoal(output.recommendedCarbs);
    setFatsGoal(output.recommendedFats);
  };

  const handleCreateMeal = (newMeal: CustomMeal) => {
    setCustomMeals(prev => [...prev, newMeal]);
  }

  const { totalCalories, totalProtein, totalCarbs, totalFats } = useMemo(() => {
    return meals.reduce(
      (totals, meal) => {
        meal.items.forEach(item => {
          const ratio = item.quantity / item.servingSize;
          totals.totalCalories += item.calories * ratio;
          totals.totalProtein += item.protein * ratio;
          totals.totalCarbs += item.carbs * ratio;
          totals.totalFats += item.fats * ratio;
        });
        return totals;
      },
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
    );
  }, [meals]);

  const chartData = useMemo(() => {
    return meals.map(meal => ({
      name: meal.name,
      calories: meal.items.reduce((sum, item) => {
          const ratio = item.quantity / item.servingSize;
          return sum + (item.calories * ratio)
      }, 0),
    }));
  }, [meals]);


  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold font-headline text-foreground">NutriTrack</h1>
            </div>
            <CreateMealDialog onCreateMeal={handleCreateMeal} />
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DailySummary
              totalCalories={totalCalories}
              calorieGoal={calorieGoal}
              protein={totalProtein}
              proteinGoal={proteinGoal}
              carbs={totalCarbs}
              carbsGoal={carbsGoal}
              fats={totalFats}
              fatsGoal={fatsGoal}
            />
            <MealList
              meals={meals}
              customMeals={customMeals}
              onAddFood={handleAddFood}
              onAddCustomMeal={handleAddCustomMeal}
              onRemoveFood={handleRemoveFood}
            />
          </div>
          <div className="space-y-6">
            <CalorieRecommendationForm onGoalSet={handleSetGoal} />
             <Card>
                <CardHeader>
                    <CardTitle>Meal Calories Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
