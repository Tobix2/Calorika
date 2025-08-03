
"use client";

import { useState, useMemo, useTransition, useEffect } from 'react';
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
import { addCustomMeal } from '@/services/mealService';

const initialMeals: Meal[] = [
  { name: 'Breakfast', items: [] },
  { name: 'Lunch', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

interface DashboardProps {
  initialFoodDatabase: FoodItem[];
  initialCustomMeals: CustomMeal[];
}

export default function Dashboard({ initialFoodDatabase, initialCustomMeals }: DashboardProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [calorieGoal, setCalorieGoal] = useState<number>(2200);
  const [proteinGoal, setProteinGoal] = useState<number>(140);
  const [carbsGoal, setCarbsGoal] = useState<number>(250);
  const [fatsGoal, setFatsGoal] = useState<number>(70);
  
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(initialFoodDatabase);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>(initialCustomMeals);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddFood = (mealName: MealName, food: FoodItem, quantity: number) => {
    setMeals(prevMeals =>
      prevMeals.map(meal => {
        if (meal.name === mealName) {
            const newItem: MealItem = {
                ...food,
                mealItemId: crypto.randomUUID(),
                quantity: quantity
            };
            return { ...meal, items: [...meal.items, newItem] };
        }
        return meal;
      })
    );
  };

  const handleAddCustomMeal = (mealName: MealName, customMeal: CustomMeal, servings: number) => {
    if (!customMeal.items || customMeal.items.length === 0) {
        const manualMealItem: MealItem = {
            id: customMeal.id,
            mealItemId: crypto.randomUUID(),
            name: customMeal.name,
            calories: customMeal.totalCalories,
            protein: customMeal.totalProtein,
            carbs: customMeal.totalCarbs,
            fats: customMeal.totalFats,
            quantity: servings, // quantity is the number of servings
            servingSize: customMeal.servingSize || 1, 
            servingUnit: customMeal.servingUnit || 'serving',
            isCustom: true,
        };
        setMeals(prevMeals => 
            prevMeals.map(meal => 
                meal.name === mealName ? { ...meal, items: [...meal.items, manualMealItem] } : meal
            )
        );
    } else {
        setMeals(prevMeals =>
        prevMeals.map(meal =>
            meal.name === mealName ? { ...meal, items: [
                ...meal.items,
                ...customMeal.items.map(item => ({
                    ...item, 
                    quantity: item.quantity * servings,
                    mealItemId: crypto.randomUUID()
                }))
            ] } : meal
        )
        );
    }
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

  const handleCreateMeal = async (newMealData: Omit<CustomMeal, 'id'>) => {
    try {
        const newMeal = await addCustomMeal(newMealData);
        setCustomMeals(prev => [...prev, newMeal]);
        toast({
            title: "Meal Created!",
            description: `${newMeal.name} has been saved to your meals.`,
        });
    } catch (error) {
        console.error("Failed to create meal:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Error Saving Meal",
            description: `Could not save to database: ${errorMessage}`,
        });
    }
  }

  const handleGeneratePlan = () => {
    startTransition(async () => {
        const result = await generateMealPlanAction({
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatsGoal,
            availableFoods: foodDatabase,
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
          if (item.isCustom) {
            totals.totalCalories += (Number(item.calories) || 0) * (Number(item.quantity) || 0);
            totals.totalProtein += (Number(item.protein) || 0) * (Number(item.quantity) || 0);
            totals.totalCarbs += (Number(item.carbs) || 0) * (Number(item.quantity) || 0);
            totals.totalFats += (Number(item.fats) || 0) * (Number(item.quantity) || 0);
          } else {
            const itemQuantity = Number(item.quantity) || 0;
            const itemServingSize = Number(item.servingSize) || 1;
            const ratio = itemServingSize > 0 ? itemQuantity / itemServingSize : 0;

            totals.totalCalories += (Number(item.calories) || 0) * ratio;
            totals.totalProtein += (Number(item.protein) || 0) * ratio;
            totals.totalCarbs += (Number(item.carbs) || 0) * ratio;
            totals.totalFats += (Number(item.fats) || 0) * ratio;
          }
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
          if (item.isCustom) {
              return sum + (Number(item.calories) || 0) * (Number(item.quantity) || 0);
          }
          const itemQuantity = Number(item.quantity) || 0;
          const itemServingSize = Number(item.servingSize) || 1;
          const ratio = itemServingSize > 0 ? itemQuantity / itemServingSize : 0;
          return sum + ((Number(item.calories) || 0) * ratio)
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
              <CreateMealDialog onCreateMeal={handleCreateMeal} foodDatabase={foodDatabase} setFoodDatabase={setFoodDatabase}/>
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
              foodDatabase={foodDatabase}
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

    