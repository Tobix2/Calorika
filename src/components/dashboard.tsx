
"use client";

import { useState, useMemo, useTransition, useEffect } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf, Bot, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';
import { Button } from '@/components/ui/button';
import { generateMealPlanAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { addCustomMeal, deleteCustomMeal, getCustomMeals } from '@/services/mealService';
import { getFoods } from '@/services/foodService';
import { useAuth } from '@/context/auth-context';
import AuthGuard from './auth-guard';
import { deleteFood } from '@/services/foodServerActions';


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
  
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    async function loadInitialData() {
        if (user) {
            try {
                setIsLoadingData(true);
                const [foods, meals] = await Promise.all([
                    getFoods(user.uid),
                    getCustomMeals(user.uid)
                ]);
                setFoodDatabase(foods);
                setCustomMeals(meals);
            } catch (error) {
                console.error("Failed to load initial data", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load your data. Please try refreshing the page.'
                });
            } finally {
                setIsLoadingData(false);
            }
        }
    }
    loadInitialData();
  }, [user, toast]);


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
    const mealItem: MealItem = {
        ...customMeal,
        id: customMeal.id,
        mealItemId: crypto.randomUUID(),
        name: customMeal.name,
        quantity: servings,
        isCustom: true,
        // The total calories for the meal are already in customMeal.calories
        // and other nutritional info.
        // We set the servingSize here so future calculations know the base unit.
        servingSize: customMeal.servingSize, 
    };

    setMeals(prevMeals => 
        prevMeals.map(meal => 
            meal.name === mealName ? { ...meal, items: [...meal.items, mealItem] } : meal
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

  const handleCreateMeal = async (newMealData: Omit<CustomMeal, 'id'>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a meal." });
        return;
    }
    try {
        const newMeal = await addCustomMeal(user.uid, newMealData);
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
  
  const handleDeleteItem = async (item: FoodItem | CustomMeal) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete items." });
        return;
    }

    console.log(`[Dashboard] Iniciando borrado para el ítem: ${item.name} (ID: ${item.id})`);

    try {
        // Un CustomMeal tiene un array 'items', un FoodItem no. Esta es una forma fiable de diferenciarlos.
        if ('items' in item) { // Es un CustomMeal
            console.log(`[Dashboard] El ítem fue identificado como CustomMeal. Llamando a deleteCustomMeal...`);
            await deleteCustomMeal(user.uid, item.id);
            setCustomMeals(prev => prev.filter(meal => meal.id !== item.id));
            toast({ title: "Comida Borrada", description: `${item.name} ha sido eliminada de tu base de datos.` });
        } else { // Es un FoodItem
            console.log(`[Dashboard] El ítem fue identificado como FoodItem. Llamando a deleteFood...`);
            await deleteFood(user.uid, item.id);
            setFoodDatabase(prev => prev.filter(food => food.id !== item.id));
            toast({ title: "Ingrediente Borrado", description: `${item.name} ha sido eliminado de tu base de datos.` });
        }
    } catch (error) {
        console.error("Falló al borrar el ítem:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({
            variant: "destructive",
            title: "Error al Borrar el Ítem",
            description: `No se pudo borrar de la base de datos: ${errorMessage}`,
        });
    }
  };

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
          const quantity = Number(item.quantity) || 0;
          
          let itemCalories = 0;
          let itemProtein = 0;
          let itemCarbs = 0;
          let itemFats = 0;

          if (item.isCustom) {
            // Para comidas personalizadas, el campo 'calories' contiene el total por porción.
            // La cantidad es el número de porciones.
            itemCalories = (Number(item.calories) || 0) * quantity;
            itemProtein = (Number(item.protein) || 0) * quantity;
            itemCarbs = (Number(item.carbs) || 0) * quantity;
            itemFats = (Number(item.fats) || 0) * quantity;
          } else {
             // Para alimentos individuales, calcular en base al tamaño de la porción.
             const servingSize = Number(item.servingSize) || 1;
             const ratio = servingSize > 0 ? quantity / servingSize : 0;
             itemCalories = (Number(item.calories) || 0) * ratio;
             itemProtein = (Number(item.protein) || 0) * ratio;
             itemCarbs = (Number(item.carbs) || 0) * ratio;
             itemFats = (Number(item.fats) || 0) * ratio;
          }
          
          totals.totalCalories += itemCalories;
          totals.totalProtein += itemProtein;
          totals.totalCarbs += itemCarbs;
          totals.totalFats += itemFats;
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
          const quantity = Number(item.quantity) || 0;
          
          if (item.isCustom) {
            return sum + (Number(item.calories) || 0) * quantity;
          }

          const itemServingSize = Number(item.servingSize) || 1;
          const ratio = itemServingSize > 0 ? quantity / itemServingSize : 0;
          return sum + ((Number(item.calories) || 0) * ratio)
      }, 0),
    }));
  }, [meals]);


  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline text-foreground">NutriTrack</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleGeneratePlan} disabled={isPending || isLoadingData}>
                  {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                  Generate Plan
                </Button>
                <CreateMealDialog 
                  onCreateMeal={handleCreateMeal} 
                  foodDatabase={foodDatabase} 
                  setFoodDatabase={setFoodDatabase}
                />
                <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2"/>
                    Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {isLoadingData ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
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
                        onDeleteItem={handleDeleteItem}
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
            )}
        </main>
      </div>
    </AuthGuard>
  );
}
