
'use server';

import {
  getCalorieRecommendation,
  type CalorieRecommendationInput,
  type CalorieRecommendationOutput,
} from '@/ai/flows/calorie-recommendation';
import {
  generateMealPlan,
} from '@/ai/flows/generate-meal-plan';
import type { GenerateMealPlanInput, GenerateMealPlanOutput, FoodItem, CustomMeal, WeeklyPlan, DailyPlan, MealItem, WeeklyWeightEntry, UserGoals, UserProfile } from '@/lib/types';
import { getDb } from '@/lib/firebase-admin';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import admin from 'firebase-admin';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';


// --- Mercado Pago Action ---
export async function createSubscriptionAction(userId: string): Promise<{ checkoutUrl: string | null; error: string | null }> {
    if (!userId) {
        return { checkoutUrl: null, error: "Usuario no autenticado." };
    }
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        console.error("MERCADOPAGO_ACCESS_TOKEN no está configurado.");
        return { checkoutUrl: null, error: "Error de configuración del servidor." };
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preapproval = new PreApproval(client);

    try {
        const result = await preapproval.create({
            body: {
                reason: 'Suscripción Pro a Calorika',
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: 10000,
                    currency_id: 'ARS',
                },
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
                payer_email: '', // MercadoPago lo llena si el usuario está logueado en su cuenta
                external_reference: userId,
            },
        });
        
        const checkoutUrl = result.init_point;
        if (!checkoutUrl) {
           return { checkoutUrl: null, error: "No se pudo generar el enlace de pago." };
        }

        return { checkoutUrl, error: null };

    } catch (error: any) {
        console.error("Error al crear la suscripción de Mercado Pago:", error);
        // Depuración detallada: Imprime el cuerpo del error si está disponible
        if (error.cause) {
            console.error("Detalles del error de Mercado Pago:", JSON.stringify(error.cause, null, 2));
        }
        return { checkoutUrl: null, error: "No se pudo conectar con Mercado Pago. Por favor, intenta de nuevo." };
    }
}


// --- AI Actions ---

export async function getRecommendationAction(
  prevState: any,
  formData: FormData
): Promise<{ data: CalorieRecommendationOutput | null; error: string | null }> {
  // Ensure all form data has valid defaults to prevent serialization errors
  const rawFormData = {
    age: Number(formData.get('age')) || 25,
    weight: Number(formData.get('weight')) || 70,
    height: Number(formData.get('height')) || 175,
    gender: formData.get('gender') || 'female',
    activityLevel: formData.get('activityLevel') || 'lightlyActive',
    goal: formData.get('goal') || 'maintainWeight',
  };

  try {
    const result = await getCalorieRecommendation(rawFormData as CalorieRecommendationInput);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
    return { data: null, error: `Error al obtener recomendación: ${errorMessage}` };
  }
}

export async function generateMealPlanAction(
  input: GenerateMealPlanInput
): Promise<{ data: GenerateMealPlanOutput | null; error: string | null }> {
    try {
        const result = await generateMealPlan(input);
        return { data: result, error: null };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { data: null, error: `Error al generar el plan de comidas: ${errorMessage}` };
    }
}

// --- Firestore Actions ---

// User Profile & Goals
export async function getUserProfileAction(userId: string): Promise<UserProfile | null> {
    try {
        const db = getDb();
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists) {
            const data = userDocSnap.data();
            return (data?.profile as UserProfile) || null;
        }
        return null;
    } catch (error) {
        console.error("🔥 Error al obtener perfil de Firestore:", error);
        throw new Error("No se pudo obtener el perfil del usuario.");
    }
}

export async function saveUserProfileAction(userId: string, profile: UserProfile): Promise<void> {
    try {
        const db = getDb();
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({ profile }, { merge: true });
    } catch (error) {
        console.error("🔥 Error al guardar perfil en Firestore:", error);
        throw new Error("No se pudo guardar el perfil del usuario.");
    }
}

export async function getUserGoalsAction(userId: string): Promise<UserGoals | null> {
    try {
        const db = getDb();
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists) {
            const data = userDocSnap.data();
            return (data?.goals as UserGoals) || null;
        }
        return null;
    } catch (error) {
        console.error("🔥 Error al obtener objetivos del usuario de Firestore:", error);
        throw new Error("No se pudieron obtener los objetivos del usuario.");
    }
}

export async function saveUserGoalsAction(userId: string, goals: UserGoals): Promise<void> {
    try {
        const db = getDb();
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({ goals }, { merge: true });
    } catch (error) {
        console.error("🔥 Error al guardar objetivos del usuario en Firestore:", error);
        throw new Error("No se pudieron guardar los objetivos del usuario.");
    }
}


// Foods
async function populateInitialFoods(userId: string): Promise<FoodItem[]> {
    const db = getDb();
    const initialFoods: Omit<FoodItem, 'id'>[] = [
      { name: 'Manzana', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, servingSize: 1, servingUnit: 'mediana' },
      { name: 'Plátano', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, servingSize: 1, servingUnit: 'mediano' },
      { name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g' },
      { name: 'Arroz Integral', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, servingSize: 100, servingUnit: 'g cocido' },
      { name: 'Huevo Entero', calories: 78, protein: 6, carbs: 0.6, fats: 5, servingSize: 1, servingUnit: 'grande' },
      { name: 'Almendras', calories: 579, protein: 21, carbs: 22, fats: 49, servingSize: 100, servingUnit: 'g' },
      { name: 'Yogur Griego', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g' },
      { name: 'Salmón', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
      { name: 'Brócoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, servingSize: 1, servingUnit: 'taza' },
      { name: 'Aceite de Oliva', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'g' },
      { name: 'Avena', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, servingSize: 100, servingUnit: 'g' },
      { name: 'Proteína en Polvo', calories: 393, protein: 80, carbs: 8, fats: 4, servingSize: 100, servingUnit: 'g' },
    ];

    const foodCollection = db.collection('users').doc(userId).collection('foods');
    const batch = db.batch();
    const addedFoods: FoodItem[] = [];

    initialFoods.forEach(food => {
        const docId = food.name.toLowerCase().replace(/\s+/g, '-');
        const docRef = foodCollection.doc(docId);
        batch.set(docRef, food);
        addedFoods.push({ id: docId, ...food });
    });

    await batch.commit();
    return addedFoods;
}

export async function getFoodsAction(userId: string): Promise<FoodItem[]> {
    try {
        const db = getDb();
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();

        if (!userDocSnap.exists) {
            await userDocRef.set({ initialized: true }); // Mark user as initialized
            return await populateInitialFoods(userId);
        }

        const foodCollection = userDocRef.collection('foods');
        const snapshot = await foodCollection.get();
        if (snapshot.empty) {
             return await populateInitialFoods(userId);
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Alimento sin nombre',
                calories: data.calories || 0,
                protein: data.protein || 0,
                carbs: data.carbs || 0,
                fats: data.fats || 0,
                servingSize: data.servingSize || 1,
                servingUnit: data.servingUnit || 'unidad',
            } as FoodItem;
        });
    } catch (error) {
        console.error("🔥 Error al obtener alimentos de Firestore:", error);
        throw new Error("No se pudieron obtener los alimentos.");
    }
}

export async function addFoodAction(userId: string, food: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    try {
        const db = getDb();
        const foodCollection = db.collection('users').doc(userId).collection('foods');
        const cleanFood = JSON.parse(JSON.stringify(food));
        const docRef = await foodCollection.add(cleanFood);
        return { id: docRef.id, ...cleanFood };
    } catch (error) {
        console.error("🔥 Error al añadir documento a Firestore: ", error);
        throw new Error('No se pudo añadir el alimento.');
    }
}

export async function deleteFoodAction(userId: string, foodId: string): Promise<void> {
    try {
        const db = getDb();
        if (!foodId) throw new Error("Se requiere el ID del alimento.");
        const foodDocRef = db.collection('users').doc(userId).collection('foods').doc(foodId);
        await foodDocRef.delete();
    } catch (error) {
        console.error("🔥 Error al borrar documento de Firestore: ", error);
        throw new Error('No se pudo borrar el alimento.');
    }
}

// Custom Meals
export async function getCustomMealsAction(userId: string): Promise<CustomMeal[]> {
    try {
        const db = getDb();
        const mealCollection = db.collection('users').doc(userId).collection('customMeals');
        const snapshot = await mealCollection.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                items: data.items || [],
                totalCalories: data.totalCalories ?? data.calories ?? 0,
                totalProtein: data.totalProtein ?? data.protein ?? 0,
                totalCarbs: data.totalCarbs ?? data.carbs ?? 0,
                totalFats: data.totalFats ?? data.fats ?? 0,
                servingSize: data.servingSize || 1,
                servingUnit: data.servingUnit || 'ración',
            } as CustomMeal;
        });
    } catch (error) {
        console.error("🔥 Error al obtener comidas personalizadas de Firestore:", error);
        throw new Error("No se pudieron obtener las comidas personalizadas.");
    }
}

export async function addCustomMealAction(userId: string, meal: Omit<CustomMeal, 'id'>): Promise<CustomMeal> {
    try {
        const db = getDb();
        const mealCollection = db.collection('users').doc(userId).collection('customMeals');
        const cleanMeal = JSON.parse(JSON.stringify(meal));
        const docRef = await mealCollection.add(cleanMeal);
        return { id: docRef.id, ...cleanMeal };
    } catch (error) {
        console.error("🔥 Error al añadir comida personalizada a Firestore: ", error);
        throw new Error('No se pudo añadir la comida personalizada.');
    }
}

export async function deleteCustomMealAction(userId: string, mealId: string): Promise<void> {
    try {
        const db = getDb();
        if (!mealId) throw new Error("Se requiere el ID de la comida.");
        const mealDocRef = db.collection('users').doc(userId).collection('customMeals').doc(mealId);
        await mealDocRef.delete();
    } catch (error) {
        console.error("🔥 Error al borrar comida personalizada de Firestore: ", error);
        throw new Error('No se pudo borrar la comida personalizada.');
    }
}

// Weekly Plan
const initialDailyPlan: DailyPlan = [
  { name: 'Breakfast', items: [] },
  { name: 'Lunch', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

const emptyGoals: UserGoals = {
    calorieGoal: 0,
    proteinGoal: 0,
    carbsGoal: 0,
    fatsGoal: 0,
};

export async function getWeeklyPlanAction(userId: string, weekDates: Date[], profileGoals: UserGoals | null): Promise<WeeklyPlan> {
    try {
        const db = getDb();
        const plansCollection = db.collection('users').doc(userId).collection('dailyPlans');
        const dateStrings = weekDates.map(d => format(d, 'yyyy-MM-dd'));
        
        const planPromises = dateStrings.map(async (dateString) => {
            const docRef = plansCollection.doc(dateString);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                // Ensure goals exist, if not, use the profile goals or empty goals
                const goals = data?.goals || profileGoals || emptyGoals;
                return { 
                    date: dateString, 
                    plan: (data?.plan || initialDailyPlan) as DailyPlan,
                    goals: goals as UserGoals,
                };
            }
            // For days without a record, use profile goals
            return { 
                date: dateString, 
                plan: initialDailyPlan, 
                goals: profileGoals || emptyGoals
            };
        });

        const dailyData = await Promise.all(planPromises);
        
        const weeklyPlan: WeeklyPlan = dailyData.reduce((acc, { date, plan, goals }) => {
            acc[date] = { plan, goals };
            return acc;
        }, {} as WeeklyPlan);

        return weeklyPlan;

    } catch (error) {
        console.error("🔥 Error al obtener el plan semanal:", error);
        throw new Error("No se pudo obtener el plan semanal.");
    }
}


export async function saveDailyPlanAction(userId: string, date: Date, plan: DailyPlan, goals: UserGoals): Promise<void> {
    try {
        const db = getDb();
        const dateString = format(date, 'yyyy-MM-dd');
        const docRef = db.collection('users').doc(userId).collection('dailyPlans').doc(dateString);
        
        // Ensure plan and goals are plain objects before saving
        const plainPlanObject = JSON.parse(JSON.stringify(plan));
        const plainGoalsObject = JSON.parse(JSON.stringify(goals));
        
        const dataToSave = { 
            plan: plainPlanObject,
            goals: plainGoalsObject,
        };

        await docRef.set(dataToSave, { merge: true });
    } catch (error) {
        console.error(`🔥 Error al guardar el plan para ${format(date, 'yyyy-MM-dd')}:`, error);
        throw new Error("No se pudo guardar el plan diario.");
    }
}


// Weight History
export async function addWeightEntryAction(userId: string, weightEntry: Omit<WeeklyWeightEntry, 'id'>): Promise<{entry: WeeklyWeightEntry, updated: boolean}> {
    try {
        const db = getDb();
        const weightCollection = db.collection('users').doc(userId).collection('weightHistory');
        const entryDate = new Date(weightEntry.date);
        
        // Find the start of the week (assuming week starts on Monday)
        const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(entryDate, { weekStartsOn: 1 });

        // Query for an existing entry in the same week
        const query = weightCollection
            .where('date', '>=', admin.firestore.Timestamp.fromDate(weekStart))
            .where('date', '<=', admin.firestore.Timestamp.fromDate(weekEnd));

        const snapshot = await query.get();

        if (snapshot.empty) {
            // No entry for this week, create a new one
            const dataToSave = {
                weight: weightEntry.weight,
                date: admin.firestore.Timestamp.fromDate(weekStart), // Store the start of the week
            };
            const docRef = await weightCollection.add(dataToSave);
            return {
                entry: {
                    id: docRef.id,
                    weight: weightEntry.weight,
                    date: weekStart.toISOString(),
                },
                updated: false
            };
        } else {
            // Entry exists, update it
            const doc = snapshot.docs[0];
            await doc.ref.update({ weight: weightEntry.weight });
            return {
                entry: {
                    id: doc.id,
                    weight: weightEntry.weight,
                    date: (doc.data().date as admin.firestore.Timestamp).toDate().toISOString(),
                },
                updated: true
            };
        }
    } catch (error) {
        console.error("🔥 Error al añadir/actualizar entrada de peso en Firestore: ", error);
        throw new Error('No se pudo guardar la entrada de peso.');
    }
}


export async function getWeightHistoryAction(userId: string): Promise<WeeklyWeightEntry[]> {
    try {
        const db = getDb();
        const weightCollection = db.collection('users').doc(userId).collection('weightHistory').orderBy('date', 'asc');
        const snapshot = await weightCollection.get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                weight: data.weight,
                date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
            } as WeeklyWeightEntry;
        });

    } catch (error) {
        console.error("🔥 Error al obtener el historial de peso de Firestore:", error);
        throw new Error("No se pudo obtener el historial de peso.");
    }
}
