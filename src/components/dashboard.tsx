
"use client";

import { useState, useMemo, useTransition } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf, Bot, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';
import { Button } from '@/components/ui/button';
import { generateMealPlanAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const initialMeals: Meal[] = [
  { name: 'Breakfast', items: [] },
  { name: 'Lunch', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

const MOCK_FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, servingSize: 1, servingUnit: 'medium' },
  { id: '2', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, servingSize: 1, servingUnit: 'medium' },
  { id: '3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: '4', name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, servingSize: 100, servingUnit: 'g cooked' },
  { id: '5', name: 'Whole Egg', calories: 78, protein: 6, carbs: 0.6, fats: 5, servingSize: 1, servingUnit: 'large' },
  { id: '6', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 49, servingSize: 100, servingUnit: 'g' },
  { id: '7', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: '8', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: '9', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, servingSize: 1, servingUnit: 'cup' },
  { id: '10', name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'g' },
  { id: '11', name: 'Oats', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, servingSize: 100, servingUnit: 'g' },
  { id: '12', name: 'Protein Powder', calories: 393, protein: 80, carbs: 8, fats: 4, servingSize: 100, servingUnit: 'g' },
];


export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [calorieGoal, setCalorieGoal] = useState<number>(2200);
  const [proteinGoal, setProteinGoal] = useState<number>(140);
  const [carbsGoal, setCarbsGoal] = useState<number>(250);
  const [fatsGoal, setFatsGoal] = useState<number>(70);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  const handleGeneratePlan = () => {
    startTransition(async () => {
        const result = await generateMealPlanAction({
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatsGoal,
            availableFoods: MOCK_FOOD_DATABASE,
            availableMeals: customMeals
        });

        if (result.error || !result.data) {
            toast({
                variant: 'destructive',
                title: 'Error Generating Plan',
                description: result.error || 'The AI could not generate a meal plan.'
            });
        } else {
            setMeals(result.data);
            toast({
                title: 'Meal Plan Generated!',
                description: 'Your daily meal plan has been populated by the AI.'
            });
        }
    });
  };

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
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleGeneratePlan} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                Generate Plan with AI
              </Button>
              <CreateMealDialog onCreateMeal={handleCreateMeal} />
            </div>
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
