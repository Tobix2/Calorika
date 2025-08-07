
"use client";

import { useState, useMemo, useTransition, useEffect, useCallback, useRef } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem, WeeklyPlan, DailyPlan, UserGoals, DayData } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf, Bot, Loader2, LogOut, WeightIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { generateMealPlanAction, saveDailyPlanAction, getWeeklyPlanAction, getFoodsAction, addCustomMealAction, deleteCustomMealAction, deleteFoodAction, getCustomMealsAction, addFoodAction, getUserGoalsAction, saveUserGoalsAction } from '@/app/actions';
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const initialDayData: DayData = {
  plan: [
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snacks', items: [] },
  ],
  goals: {
    calorieGoal: 0,
    proteinGoal: 0,
    carbsGoal: 0,
    fatsGoal: 0,
  }
};


export default function Dashboard() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Persisted goals from user profile, used for FUTURE days
  const [profileGoals, setProfileGoals] = useState<UserGoals | null>(null);

  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  
  const [isAiPending, startAiTransition] = useTransition();
  const [isSavingGoals, startSavingGoalsTransition] = useTransition();

  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isGeneratePlanDialogOpen, setIsGeneratePlanDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isInitialLoadRef = useRef(true);


  const selectedDateKey = format(currentDate, 'yyyy-MM-dd');
  // Safely access dayData and its goals property
  const dayData = weeklyPlan[selectedDateKey] || initialDayData;
  const { plan: meals, goals } = dayData || initialDayData;
  const { calorieGoal, proteinGoal, carbsGoal, fatsGoal } = goals || initialDayData.goals;


  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
    const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const loadWeeklyPlan = useCallback(async (user: any, dates: Date[], goals: UserGoals | null) => {
      isInitialLoadRef.current = true; // Set flag before loading
      try {
          const plan = await getWeeklyPlanAction(user.uid, dates, goals);
          setWeeklyPlan(plan);
      } catch (error) {
          console.error("No se pudo cargar el plan semanal", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'No se pudo cargar tu plan. Por favor, intenta refrescar.'
          });
      } finally {
        // Use a timeout to ensure the state update has propagated before allowing saves
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
  }, [toast]);

  // Initial data load for user profile and first week
  useEffect(() => {
    async function loadInitialData() {
        if (user) {
            try {
                const [foods, mealsData, goals] = await Promise.all([
                    getFoodsAction(user.uid),
                    getCustomMealsAction(user.uid),
                    getUserGoalsAction(user.uid),
                ]);
                setFoodDatabase(foods);
                setCustomMeals(mealsData);
                setProfileGoals(goals);
                await loadWeeklyPlan(user, weekDates, goals);
            } catch (error) {
                console.error("No se pudieron cargar los datos iniciales", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudieron cargar tus datos. Por favor, refresca la página.'
                });
            } finally {
                setIsLoading(false);
            }
        }
    }
    loadInitialData();
  }, [user, toast]); // weekDates is removed to prevent re-triggering just on date change

  // This effect reloads the weekly plan ONLY when the week itself changes.
  useEffect(() => {
    if(user && !isInitialLoadRef.current) { // prevent re-fetching on initial load
        loadWeeklyPlan(user, weekDates, profileGoals);
    }
  }, [weekDates, user]); // Note: profileGoals is removed, it's passed into loadWeeklyPlan directly

  
  // Effect to save the plan whenever it changes, but not on initial load
  useEffect(() => {
    if (!isInitialLoadRef.current && dayData && user) {
        saveDailyPlanAction(user.uid, currentDate, dayData.plan, dayData.goals);
    }
  }, [weeklyPlan, user, currentDate]); // Rerunning on weeklyPlan change handles all updates


  const updateDayData = (newDayData: Partial<DayData>) => {
    const updatedDayData = {
        ...(weeklyPlan[selectedDateKey] || initialDayData),
        ...newDayData,
        goals: {
            ...(weeklyPlan[selectedDateKey]?.goals || initialDayData.goals),
            ...newDayData.goals,
        }
    };
    
    setWeeklyPlan(prev => ({
        ...prev,
        [selectedDateKey]: updatedDayData
    }));
    // The useEffect listening to weeklyPlan will handle saving.
  }

  const handleAddFood = (mealName: MealName, food: FoodItem, quantity: number) => {
    const newMeals = meals.map((meal: Meal) => {
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
    updateDayData({ plan: newMeals });
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

    const newMeals = meals.map((meal: Meal) => {
        if (meal.name === mealName) {
            return { ...meal, items: [...meal.items, mealItem] };
        }
        return meal;
    });

    updateDayData({ plan: newMeals });
  };

  const handleRemoveFood = (mealName: MealName, mealItemId: string) => {
    const newMeals = meals.map((meal: Meal) =>
        meal.name === mealName
          ? { ...meal, items: meal.items.filter(item => item.mealItemId !== mealItemId) }
          : meal
    );
    updateDayData({ plan: newMeals });
  };

  const handleSetGoal = (newGoals: UserGoals) => {
    updateDayData({ goals: newGoals });
  };
  
  const handleSaveGoals = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para guardar tus objetivos.' });
        return;
    }
    const goalsToSave: UserGoals = {
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatsGoal,
    };

    startSavingGoalsTransition(async () => {
        try {
            await saveUserGoalsAction(user.uid, goalsToSave);
            setProfileGoals(goalsToSave); // Update the global profile goals state
            toast({
                title: '¡Objetivos Guardados!',
                description: 'Tus metas personalizadas se han guardado y se aplicarán a los días futuros.',
            });
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
             toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: errorMessage,
            });
        }
    });
  }

  const handleCreateMeal = async (newMealData: Omit<CustomMeal, 'id'>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para crear una comida." });
        return;
    }
    try {
        const newMeal = await addCustomMealAction(user.uid, newMealData);
        setCustomMeals(prev => [...prev, newMeal]);
        toast({
            title: "¡Comida Creada!",
            description: `${newMeal.name} ha sido guardada en tus comidas.`,
        });
    } catch (error) {
        console.error("Falló al crear la comida:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({
            variant: "destructive",
            title: "Error al Guardar la Comida",
            description: `No se pudo guardar en la base de datos: ${errorMessage}`,
        });
    }
  }
  
  const handleDeleteItem = async (item: FoodItem | CustomMeal) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para borrar ítems." });
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
    startAiTransition(async () => {
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
                title: 'Error al Generar Plan',
                description: result.error || 'La IA no pudo generar un plan de comidas.'
            });
        } else {
            const newPlan = result.data as DailyPlan;
            updateDayData({ plan: newPlan });
            toast({
                title: '¡Plan de Comidas Generado!',
                description: `Tu plan de comidas para el ${format(currentDate, 'PPP', { locale: es })} ha sido poblado por la IA.`
            });
        }
    });
  };
  
    const handleAddIngredient = async (newIngredientData: Omit<FoodItem, 'id'>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para añadir un ingrediente." });
        return null;
    }
    try {
      const newIngredient = await addFoodAction(user.uid, newIngredientData);
      
      setFoodDatabase(prev => [...prev, newIngredient]);
      
      toast({
        title: "¡Ingrediente Guardado!",
        description: `${newIngredient.name} ha sido añadido a la base de datos.`,
      });

      return newIngredient;
    } catch (error) {
      console.error("Falló al guardar el ingrediente:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      toast({
        variant: "destructive",
        title: "Error al Guardar Ingrediente",
        description: `No se pudo guardar en la base de datos: ${errorMessage}`,
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
          const ratio = servingSize > 0 ? quantity / servingSize : 0;
          
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
          const ratio = servingSize > 0 ? quantity / servingSize : 0;
          return sum + ((item.calories || 0) * ratio);
      }, 0),
    }));
  }, [meals]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
                <Button variant="outline" asChild>
                  <Link href="/tracker">
                    <WeightIcon className="mr-2"/>
                    Mi Progreso
                  </Link>
                </Button>
                <AlertDialog open={isGeneratePlanDialogOpen} onOpenChange={setIsGeneratePlanDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" disabled={isAiPending}>
                      {isAiPending ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                      Generar Plan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generar Plan de Comidas para el {format(currentDate, 'PPP', { locale: es })}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Elige qué recursos debe usar la IA para generar tu plan de comidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                      <Button onClick={() => handleGeneratePlan('both')}>Usar Ingredientes y Mis Comidas</Button>
                      <Button variant="secondary" onClick={() => handleGeneratePlan('ingredients')}>Usar Solo Ingredientes</Button>
                      <Button variant="secondary" onClick={() => handleGeneratePlan('meals')}>Usar Solo Mis Comidas</Button>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                    Cerrar Sesión
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
                    onGoalChange={handleSetGoal}
                    onSaveGoals={handleSaveGoals}
                    isSaving={isSavingGoals}
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
                <CalorieRecommendationForm onGoalSet={(newGoals) => {
                    handleSetGoal(newGoals);
                    // This call might be redundant if the user is expected to save manually,
                    // but it applies the goal to the current day immediately.
                    // To make saving explicit, you could have this just update the profileGoals state
                    // and let the user click save. For now, it also saves.
                    if (user) {
                      startSavingGoalsTransition(async () => {
                        await saveUserGoalsAction(user.uid, newGoals);
                        setProfileGoals(newGoals);
                      });
                    }
                }} />

                <Card>
                    <CardHeader>
                        <CardTitle>Desglose de Calorías por Comida</CardTitle>
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
    </AuthGuard>
  );
}
