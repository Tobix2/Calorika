
"use client";

import { useState, useMemo, useTransition, useEffect, useCallback, useRef } from 'react';
import type { Meal, MealName, FoodItem, CustomMeal, MealItem, WeeklyPlan, DailyPlan, UserGoals, DayData } from '@/lib/types';
import DailySummary from './daily-summary';
import MealList from './meal-list';
import CalorieRecommendationForm from './calorie-recommendation-form';
import CreateMealDialog from './create-meal-dialog';
import { Leaf, Bot, Loader2, LogOut, WeightIcon, User, Star, BrainCircuit, BarChart2, LayoutDashboard, MessageSquare, Plus, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { generateMealPlanAction, saveDailyPlanAction, getWeeklyPlanAction, getFoodsAction, addCustomMealAction, deleteCustomMealAction, deleteFoodAction, getCustomMealsAction, addFoodAction, getUserGoalsAction, saveUserGoalsAction, createSubscriptionAction } from '@/app/actions';
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isBefore, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import WelcomeTutorial from './welcome-tutorial';
import AddIngredientDialog from './add-ingredient-dialog';


const initialDayData: DayData = {
  plan: [
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Merienda', items: [] },
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


interface DashboardProps {
  userId?: string;
  isProfessionalView?: boolean;
}

export default function Dashboard({ userId, isProfessionalView = false }: DashboardProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [profileGoals, setProfileGoals] = useState<UserGoals | null>(null);

  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubscribing, startSubscribingTransition] = useTransition();

  const { toast } = useToast();
  const auth = useAuth();
  
  const effectiveUserId = userId || auth.user?.uid;
  const user = auth.user;


  const [isGeneratePlanDialogOpen, setIsGeneratePlanDialogOpen] = useState(false);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const isInitialLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);


  const selectedDateKey = format(currentDate, 'yyyy-MM-dd');
  const dayData = weeklyPlan[selectedDateKey] || initialDayData;
  const { plan: meals, goals } = dayData;
  const { calorieGoal, proteinGoal, carbsGoal, fatsGoal } = goals || initialDayData.goals;
  
  // Save debounced data effect
  useEffect(() => {
    // Clear any existing timer when dayData changes
    if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to save data after 1 second
    debounceTimerRef.current = setTimeout(() => {
        if (effectiveUserId && !isInitialLoadRef.current) {
             const { plan, goals } = weeklyPlan[selectedDateKey] || initialDayData;
             if (goals.calorieGoal > 0 || plan.some(m => m.items.length > 0)) {
                saveDailyPlanAction(effectiveUserId, currentDate, plan, goals).catch(err => {
                    console.error("Error al autoguardar plan diario:", err);
                    toast({ variant: 'destructive', title: 'Error de Guardado', description: 'No se pudo guardar tu plan.' });
                });
             }
        }
    }, 1000); // 1-second debounce

    // Cleanup timer on component unmount
    return () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    };
}, [weeklyPlan, selectedDateKey, currentDate, effectiveUserId, toast]);


  const updateDayData = useCallback((newDayData: Partial<DayData>) => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
  
    setWeeklyPlan(prev => {
        const newWeeklyPlan = { ...prev };
        const currentDay = prev[dateKey] ? { ...prev[dateKey] } : JSON.parse(JSON.stringify(initialDayData));

        const updatedDayData: DayData = {
            ...currentDay,
            plan: newDayData.plan ? JSON.parse(JSON.stringify(newDayData.plan)) : currentDay.plan,
            goals: newDayData.goals ? { ...currentDay.goals, ...newDayData.goals } : currentDay.goals,
        };

        newWeeklyPlan[dateKey] = updatedDayData;
        return newWeeklyPlan;
    });
  }, [currentDate]);


  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const loadWeeklyPlan = useCallback(async (uid: string, dates: Date[], goals: UserGoals | null) => {
      try {
          const plan = await getWeeklyPlanAction(uid, dates, goals);
          
          // Logic to apply profile goals if the current day has no goals set
          const todayKey = format(new Date(), 'yyyy-MM-dd');
          if (goals && isSameDay(currentDate, new Date()) && !isProfessionalView) {
              const currentDayData = plan[todayKey];
              if (!currentDayData || currentDayData.goals.calorieGoal === 0) {
                  plan[todayKey] = {
                      ... (currentDayData || initialDayData),
                      goals: goals
                  };
              }
          }
          setWeeklyPlan(plan);
      } catch (error) {
          console.error("No se pudo cargar el plan semanal", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'No se pudo cargar tu plan. Por favor, intenta refrescar.'
          });
      }
  }, [toast, currentDate, isProfessionalView]);
  

  // Initial data load for user profile, foods, and custom meals.
  useEffect(() => {
    async function loadInitialData() {
        if (effectiveUserId) {
            isInitialLoadRef.current = true;
            setIsLoading(true);
            try {
                // Check if tutorial has been seen
                const hasSeenTutorial = localStorage.getItem('calorika_tutorial_seen');
                if (!hasSeenTutorial && !isProfessionalView) {
                    setShowTutorial(true);
                }
                const [foods, mealsData, goals] = await Promise.all([
                    getFoodsAction(effectiveUserId),
                    getCustomMealsAction(effectiveUserId),
                    getUserGoalsAction(effectiveUserId),
                ]);
                setFoodDatabase(foods);
                setCustomMeals(mealsData);
                setProfileGoals(goals);
                await loadWeeklyPlan(effectiveUserId, weekDates, goals);
            } catch (error) {
                console.error("No se pudieron cargar los datos iniciales", error);
                toast({
                    variant: 'destructive',
                    title: 'Error de Carga',
                    description: 'No se pudieron cargar tus datos. Por favor, refresca la página.'
                });
            } finally {
                setIsLoading(false);
                setTimeout(() => { isInitialLoadRef.current = false; }, 500); 
            }
        }
    }
    loadInitialData();
  }, [effectiveUserId, loadWeeklyPlan, toast, weekDates, isProfessionalView]);
  

  // This effect reloads the weekly plan ONLY when the week itself changes (via weekDates).
   useEffect(() => {
    if(effectiveUserId && !isInitialLoadRef.current) {
        loadWeeklyPlan(effectiveUserId, weekDates, profileGoals);
    }
  }, [weekDates, effectiveUserId, loadWeeklyPlan, profileGoals]);


  const handleAddFood = (mealName: MealName, food: FoodItem, quantity: number) => {
    console.log(`[ADD_FOOD] Añadiendo a ${mealName}:`, { food, quantity });
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
    console.log(`[ADD_CUSTOM_MEAL] Añadiendo a ${mealName}:`, { customMeal, servings });
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
    console.log(`[REMOVE_FOOD] Quitando de ${mealName}:`, { mealItemId });
    const newMeals = meals.map((meal: Meal) =>
        meal.name === mealName
          ? { ...meal, items: meal.items.filter(item => item.mealItemId !== mealItemId) }
          : meal
    );
    updateDayData({ plan: newMeals });
  };

  const handleSetGoal = useCallback((newGoals: UserGoals) => {
    updateDayData({ goals: newGoals });
  }, [updateDayData]);

  const handleCreateMeal = async (newMealData: Omit<CustomMeal, 'id'>) => {
    if (!effectiveUserId) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para crear una comida." });
        return;
    }
    console.log("[CREATE_MEAL] Creando nueva comida:", newMealData);
    try {
        const newMeal = await addCustomMealAction(effectiveUserId, newMealData);
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
    if (!effectiveUserId) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para borrar ítems." });
        return;
    }
    console.log("[DELETE_ITEM] Borrando ítem:", item);
    try {
      if ('items' in item) { 
            await deleteCustomMealAction(effectiveUserId, item.id);
            setCustomMeals(prev => prev.filter(meal => meal.id !== item.id));
            toast({ title: "Comida Borrada", description: `${item.name} ha sido eliminada de tu base de datos.` });
        } else { // Es un FoodItem
            await deleteFoodAction(effectiveUserId, item.id);
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
    if (!effectiveUserId) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión para añadir un ingrediente." });
        return null;
    }
    console.log("[ADD_INGREDIENT] Añadiendo nuevo ingrediente:", newIngredientData);
    try {
      const newIngredient = await addFoodAction(effectiveUserId, newIngredientData);
      
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
  
  const handleSubscribe = (plan: 'premium_monthly' | 'premium_annual') => {
        setIsSubscribeDialogOpen(false);
        if (!user || !user.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener la información del usuario.'});
            return;
        };
        startSubscribingTransition(async () => {
            const { checkoutUrl, error } = await createSubscriptionAction(user.uid, user.email!, plan);
            if (error || !checkoutUrl) {
                toast({
                    variant: 'destructive',
                    title: 'Error al suscribirse',
                    description: error || 'No se pudo generar el enlace de pago.'
                });
            } else {
                window.location.href = checkoutUrl;
            }
        });
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
        <WelcomeTutorial open={showTutorial} onOpenChange={setShowTutorial} />
        {!isProfessionalView && (
            <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Leaf className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold font-headline text-foreground">Calorika</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        
                        <AlertDialog open={isGeneratePlanDialogOpen} onOpenChange={setIsGeneratePlanDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isAiPending}>
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
                        
                        <div className="flex items-center gap-2">
                             <AddIngredientDialog onAddIngredient={handleAddIngredient}>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Añadir Ingrediente
                                </Button>
                            </AddIngredientDialog>
                            <CreateMealDialog 
                                onCreateMeal={handleCreateMeal} 
                                foodDatabase={foodDatabase} 
                                setFoodDatabase={setFoodDatabase}
                                onAddIngredient={handleAddIngredient}
                            />
                        </div>
                        
                        <AlertDialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
                           <AlertDialogTrigger asChild>
                             <Button>
                               <Star className="mr-2 h-4 w-4" />
                               Suscribirse
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Elige tu Plan Premium</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Desbloquea todas las funcionalidades de Calorika para alcanzar tus metas más rápido.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <div className="flex flex-col sm:flex-row gap-4 py-4">
                               <Button
                                 onClick={() => handleSubscribe('premium_monthly')}
                                 disabled={isSubscribing}
                                 className="w-full h-auto flex flex-col p-4"
                               >
                                 {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                 <span className="text-lg font-semibold">Plan Mensual</span>
                                 <span className="text-sm font-normal">$10.000 / mes</span>
                               </Button>
                               <Button
                                 onClick={() => handleSubscribe('premium_annual')}
                                 disabled={isSubscribing}
                                 className="w-full h-auto flex flex-col p-4"
                               >
                                 {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                 <span className="text-lg font-semibold">Plan Anual</span>
                                 <span className="text-sm font-normal">$100.000 / año</span>
                                 <span className="text-xs font-bold mt-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full">¡Ahorra 2 meses!</span>
                               </Button>
                             </div>
                             <AlertDialogFooter>
                               <AlertDialogCancel disabled={isSubscribing}>Cancelar</AlertDialogCancel>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Avatar'} />
                                <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href="/chat">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>Chatear con mi Profesional</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/tracker">
                                <WeightIcon className="mr-2 h-4 w-4" />
                                <span>Mi Progreso</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={auth.logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </div>
                </div>
            </header>
        )}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <WeekNavigator 
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                weekDates={weekDates}
            />
            <Tabs defaultValue="panel" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="panel">
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                        Panel
                    </TabsTrigger>
                    <TabsTrigger value="asesor-ia">
                         <BrainCircuit className="mr-2 h-4 w-4" />
                        Asesor IA
                    </TabsTrigger>
                    <TabsTrigger value="desglose">
                         <BarChart2 className="mr-2 h-4 w-4" />
                        Desglose
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="panel" className="mt-6">
                    <div className="space-y-6">
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
                </TabsContent>
                <TabsContent value="asesor-ia" className="mt-6">
                    <CalorieRecommendationForm onGoalSet={(newGoals) => {
                        handleSetGoal(newGoals);
                        if (effectiveUserId && !isProfessionalView) {
                        saveUserGoalsAction(effectiveUserId, newGoals).then(() => {
                            setProfileGoals(newGoals);
                        });
                        }
                    }} />
                </TabsContent>
                <TabsContent value="desglose" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Desglose de Calorías por Comida</CardTitle>
                            <CardDescription>Visualiza cómo se distribuyen las calorías en tus comidas del día.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart data={chartData}>
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
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}
