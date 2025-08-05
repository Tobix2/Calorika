
"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem, WeeklyPlan, DailyPlan } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf, Bot, Loader2, LogOut, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';
import { Button } from '@/components/ui/button';
import { generateMealPlanAction, saveDailyPlanAction, getWeeklyPlanAction, getFoodsAction, addCustomMealAction, deleteCustomMealAction, deleteFoodAction, getCustomMealsAction, addFoodAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import AuthGuard from './auth-guard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import WeekNavigator from './week-navigator';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, a } from 'date-fns';
import { es } from 'date-fns/locale';

const initialDailyPlan: DailyPlan = [
  { name: 'Breakfast', items: [] },
  { name: 'Lunch', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

export default function Dashboard() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [calorieGoal, setCalorieGoal] = useState<number>(2200);
  const [proteinGoal, setProteinGoal] = useState<number>(140);
  const [carbsGoal, setCarbsGoal] = useState<number>(250);
  const [fatsGoal, setFatsGoal] = useState<number>(70);
  
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isGeneratePlanDialogOpen, setIsGeneratePlanDialogOpen] = useState(false);

  const selectedDateKey = format(currentDate, 'yyyy-MM-dd');
  const meals = weeklyPlan[selectedDateKey] || initialDailyPlan;

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
    const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const loadWeeklyPlan = useCallback(async (user: any, dates: Date[]) => {
      try {
          const plan = await getWeeklyPlanAction(user.uid, dates);
          setWeeklyPlan(plan);
      } catch (error) {
          console.error("Failed to load weekly plan", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not load your plan. Please try refreshing.'
          });
      }
  }, [toast]);

  // Carga inicial de datos de usuario y primer plan semanal
  useEffect(() => {
    async function loadInitialData() {
        if (user) {
            try {
                const [foods, mealsData] = await Promise.all([
                    getFoodsAction(user.uid),
                    getCustomMealsAction(user.uid),
                ]);
                setFoodDatabase(foods);
                setCustomMeals(mealsData);
                loadWeeklyPlan(user, weekDates);
            } catch (error) {
                console.error("Failed to load initial data", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load your data. Please try refreshing the page.'
                });
            }
        }
    }
    loadInitialData();
  }, [user, toast]); // Solo se ejecuta cuando el usuario cambia

  // Recarga el plan semanal cuando cambia la semana
  useEffect(() => {
    if(user) {
        loadWeeklyPlan(user, weekDates);
    }
  }, [weekDates, user, loadWeeklyPlan]);
  
  // Guardado automático del plan diario
  useEffect(() => {
      if (!user || !weeklyPlan[selectedDateKey]) {
          return;
      }
      
      const handler = setTimeout(() => {
          saveDailyPlanAction(user.uid, currentDate, weeklyPlan[selectedDateKey]).catch(error => {
              console.error("Failed to save daily plan", error);
              toast({
                  variant: 'destructive',
                  title: 'Save Error',
                  description: 'Could not save your latest changes.'
              });
          });
      }, 1000); 

      return () => {
          clearTimeout(handler);
      };
  }, [weeklyPlan, selectedDateKey, currentDate, user, toast]);


  const handleAddFood = (mealName: MealName, food: FoodItem, quantity: number) => {
    setWeeklyPlan(prevPlan => {
        const newPlan = JSON.parse(JSON.stringify(prevPlan)); 
        const dayPlan = newPlan[selectedDateKey] || JSON.parse(JSON.stringify(initialDailyPlan));
        const updatedDayPlan = dayPlan.map((meal: Meal) => {
            if (meal.name === mealName) {
                const newItem: MealItem = {
                    ...food,
                    mealItemId: crypto.randomUUID(),
                    quantity: quantity
                };
                return { ...meal, items: [...meal.items, newItem] };
            }
            return meal;
        });
        newPlan[selectedDateKey] = updatedDayPlan;
        return newPlan; 
    });
  };

  const handleAddCustomMeal = (mealName: MealName, customMeal: CustomMeal, servings: number) => {
    const mealItem: MealItem = {
        ...customMeal,
        id: customMeal.id,
        mealItemId: crypto.randomUUID(),
        name: customMeal.name,
        calories: customMeal.totalCalories,
        protein: customMeal.totalProtein,
        carbs: customMeal.totalCarbs,
        fats: customMeal.totalFats,
        quantity: servings,
        isCustom: true,
        servingSize: customMeal.servingSize, 
        servingUnit: customMeal.servingUnit,
    };

    setWeeklyPlan(prevPlan => {
        const newPlan = JSON.parse(JSON.stringify(prevPlan));
        const dayPlan = newPlan[selectedDateKey] || JSON.parse(JSON.stringify(initialDailyPlan));
        const updatedDayPlan = dayPlan.map((meal: Meal) => {
            if (meal.name === mealName) {
                return { ...meal, items: [...meal.items, mealItem] };
            }
            return meal;
        });
        newPlan[selectedDateKey] = updatedDayPlan;
        return newPlan; 
    });
  };

  const handleRemoveFood = (mealName: MealName, mealItemId: string) => {
    setWeeklyPlan(prevPlan => {
        const newPlan = JSON.parse(JSON.stringify(prevPlan));
        if (!newPlan[selectedDateKey]) return newPlan;

        const dayPlan = newPlan[selectedDateKey];
        const updatedDayPlan = dayPlan.map((meal: Meal) =>
            meal.name === mealName
              ? { ...meal, items: meal.items.filter(item => item.mealItemId !== mealItemId) }
              : meal
        );
        newPlan[selectedDateKey] = updatedDayPlan;
        return newPlan; 
    });
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
        const newMeal = await addCustomMealAction(user.uid, newMealData);
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
    try {
      if ('items' in item) { 
            await deleteCustomMealAction(user.uid, item.id);
            setCustomMeals(prev => prev.filter(meal => meal.id !== item.id));
            toast({ title: "Comida Borrada", description: `${item.name} ha sido eliminada de tu base de datos.` });
        } else { // Es un FoodItem
            await deleteFoodAction(user.uid, item.id);
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

  const handleGeneratePlan = (mode: 'ingredients' | 'meals' | 'both') => {
    setIsGeneratePlanDialogOpen(false);
    startTransition(async () => {
        let payload: any = {
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatsGoal,
        };

        if (mode === 'ingredients') {
            payload.availableFoods = foodDatabase;
        } else if (mode === 'meals') {
            payload.availableMeals = customMeals;
        } else {
            payload.availableFoods = foodDatabase;
            payload.availableMeals = customMeals;
        }

        const result = await generateMealPlanAction(payload);

        if (result.error || !result.data) {
            toast({
                variant: 'destructive',
                title: 'Error Generating Plan',
                description: result.error || 'The AI could not generate a meal plan.'
            });
        } else {
            setWeeklyPlan(prevPlan => ({
                ...prevPlan,
                [selectedDateKey]: result.data as DailyPlan
            }));
            toast({
                title: 'Meal Plan Generated!',
                description: `Your meal plan for ${format(currentDate, 'PPP', { locale: es })} has been populated by the AI.`
            });
        }
    });
  };
  
    const handleAddIngredient = async (newIngredientData: Omit<FoodItem, 'id'>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add an ingredient." });
        return null;
    }
    try {
      const newIngredient = await addFoodAction(user.uid, newIngredientData);
      
      setFoodDatabase(prev => [...prev, newIngredient]);
      
      toast({
        title: "Ingredient Saved!",
        description: `${newIngredient.name} has been added to the database.`,
      });

      return newIngredient;
    } catch (error) {
      console.error("Failed to save ingredient:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Error Saving Ingredient",
        description: `Could not save to database: ${errorMessage}`,
      });
      return null;
    }
  };


  const { totalCalories, totalProtein, totalCarbs, totalFats } = useMemo(() => {
    return meals.reduce(
      (totals, meal) => {
        meal.items.forEach(item => {
          const quantity = Number(item.quantity) || 0;
          const servingSize = Number(item.servingSize) || 1;
          let ratio = 0;

          if (item.isCustom) {
            if (item.servingUnit?.toLowerCase() === 'serving' || item.servingUnit?.toLowerCase() === 'porcion') {
              ratio = quantity;
            } else {
              ratio = servingSize > 0 ? quantity / servingSize : 0;
            }
          } else {
             ratio = servingSize > 0 ? quantity / servingSize : 0;
          }
          
          totals.totalCalories += (item.calories || 0) * ratio;
          totals.totalProtein += (item.protein || 0) * ratio;
          totals.totalCarbs += (item.carbs || 0) * ratio;
          totals.totalFats += (item.fats || 0) * ratio;
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
          const servingSize = Number(item.servingSize) || 1;
          let ratio = 0;

          if (item.isCustom) {
              if (item.servingUnit?.toLowerCase().includes('serving') || item.servingUnit?.toLowerCase().includes('porcion')) {
                  ratio = quantity;
              } else {
                  ratio = servingSize > 0 ? quantity / servingSize : 0;
              }
          } else {
             ratio = servingSize > 0 ? quantity / servingSize : 0;
          }
          return sum + ((item.calories || 0) * ratio);
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

                <AlertDialog open={isGeneratePlanDialogOpen} onOpenChange={setIsGeneratePlanDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" disabled={isPending}>
                      {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                      Generate Plan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generate Meal Plan for {format(currentDate, 'PPP', { locale: es })}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Choose which resources the AI should use to generate your meal plan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                      <Button onClick={() => handleGeneratePlan('both')}>Use Ingredients &amp; My Meals</Button>
                      <Button variant="secondary" onClick={() => handleGeneratePlan('ingredients')}>Use Ingredients Only</Button>
                      <Button variant="secondary" onClick={() => handleGeneratePlan('meals')}>Use My Meals Only</Button>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <CreateMealDialog 
                  onCreateMeal={handleCreateMeal} 
                  foodDatabase={foodDatabase} 
                  setFoodDatabase={setFoodDatabase}
                  onAddIngredient={handleAddIngredient}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                <WeekNavigator 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    weekDates={weekDates}
                />
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
                <Card>
                    <CardHeader>
                        <CardTitle>Notas de Depuración</CardTitle>
                        <CardDescription>Pasos clave para depurar la inicialización de Firebase Admin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <Code className="h-5 w-5 mt-1 text-primary"/>
                            <div>
                                <p className="font-semibold">1. Verificar Logs en el Servidor</p>
                                <p className="text-muted-foreground">Revisa la terminal donde corre el servidor para ver los logs de Firebase Admin.</p>
                                <pre className="mt-2 bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto">
                                    <code>{`Firebase Admin SDK imported. Apps count: 0\n🔥 Firebase Admin initialized successfully.`}</code>
                                </pre>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Code className="h-5 w-5 mt-1 text-primary"/>
                            <div>
                                <p className="font-semibold">2. Revisar la `serviceAccount`</p>
                                <p className="text-muted-foreground">Asegúrate de que la variable de entorno y el JSON de la cuenta de servicio sean válidos y correctos.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Code className="h-5 w-5 mt-1 text-primary"/>
                            <div>
                                <p className="font-semibold">3. Llamar `initializeApp` solo una vez</p>
                                <p className="text-muted-foreground">Usa un condicional como `if (admin.apps.length === 0)` para evitar errores de reinicialización.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </main>
      </div>
    </AuthGuard>
  );
}
