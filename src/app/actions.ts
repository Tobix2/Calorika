
'use server';

import {
  getCalorieRecommendation,
  type CalorieRecommendationInput,
  type CalorieRecommendationOutput,
} from '@/ai/flows/calorie-recommendation';
import {
  generateMealPlan,
} from '@/ai/flows/generate-meal-plan';
import type { GenerateMealPlanInput, GenerateMealPlanOutput, FoodItem, CustomMeal, WeeklyPlan, DailyPlan, MealItem, WeeklyWeightEntry, UserGoals, UserProfile, Client, UserRole } from '@/lib/types';
import { getDb } from '@/lib/firebase-admin';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import admin from 'firebase-admin';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { revalidatePath } from 'next/cache';
import { getDateKey } from '@/lib/date';


// --- Mercado Pago Action ---

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
  console.error("❌ FATAL: MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno.");
  throw new Error("Error de configuración del servidor. El administrador ha sido notificado.");
}
const mpClient = new MercadoPagoConfig({ accessToken });


export async function createSubscriptionAction(
    userId: string,
    payerEmail: string,
    plan: string,
    metadata?: Record<string, any>
  ): Promise<{ checkoutUrl: string | null; error: string | null }> {
  
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("❌ NEXT_PUBLIC_APP_URL no está configurado en las variables de entorno.");
      return { checkoutUrl: null, error: "Error de configuración del servidor. El administrador ha sido notificado." };
    }
  
    if (!userId || !payerEmail) {
      return { checkoutUrl: null, error: "Usuario o email no válido." };
    }
  
    console.log(`[LOG]: Creando suscripción para el usuario: ${userId} con email: ${payerEmail} y plan: ${plan}`);
  
    const preapproval = new PreApproval(mpClient);
  
    let preapprovalData: any;
  
    if (plan.startsWith('premium')) {
      const isAnnual = plan === 'premium_annual';
      preapprovalData = {
        reason: isAnnual ? 'Suscripción Anual Premium a Calorika' : 'Suscripción Mensual Premium a Calorika',
        auto_recurring: {
          frequency: isAnnual ? 12 : 1,
          frequency_type: 'months',
          transaction_amount: isAnnual ? 100000 : 10000,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/dashboard?payment=success`,
        payer_email: payerEmail,
        external_reference: userId,
      };
    } else if (plan === 'professional_client') {
      preapprovalData = {
        reason: `Suscripción para cliente adicional`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 5000,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/pro-dashboard?payment=success`,
        payer_email: payerEmail,
        external_reference: userId, // Professional's ID
        metadata: {
          ...metadata,
          plan_type: 'professional_client' // For webhook identification
        }
      };
    } else {
      return { checkoutUrl: null, error: "Plan no válido." };
    }
  
    console.log("[LOG]: Enviando solicitud a Mercado Pago con el cuerpo:", JSON.stringify(preapprovalData, null, 2));
  
    try {
      const response = await preapproval.create({ body: preapprovalData });
  
      const checkoutUrl = response.init_point;
      if (!checkoutUrl) {
        console.error("La respuesta de Mercado Pago no contiene un init_point (URL de checkout).");
        return { checkoutUrl: null, error: "No se pudo generar el enlace de pago." };
      }
  
      console.log("URL de checkout de Mercado Pago generada exitosamente:", checkoutUrl);
      return { checkoutUrl, error: null };
  
    } catch (error: any) {
      console.error("❌ Error al crear la suscripción de Mercado Pago:", error);
  
      let errorMessage = "No se pudo conectar con Mercado Pago. Por favor, intenta de nuevo.";
      if (error.cause && Array.isArray(error.cause) && error.cause.length > 0) {
        errorMessage = `Error de Mercado Pago: ${error.cause[0].description || error.message}`;
      } else if (error.message) {
        errorMessage = `Error de Mercado Pago: ${error.message}`;
      }
  
      return { checkoutUrl: null, error: errorMessage };
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
            const profile: UserProfile = {
                displayName: data?.profile?.displayName || '',
                age: data?.profile?.age,
                role: data?.profile?.role || 'cliente',
                paidClientSlots: data?.paidClientSlots || 0,
            };
            return profile;
        }
        return null;
    } catch (error) {
        console.error("🔥 Error al obtener perfil de Firestore:", error);
        throw new Error("No se pudo obtener el perfil del usuario.");
    }
}

export async function saveUserProfileAction(userId: string, profile: Partial<UserProfile>): Promise<void> {
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
        const foodCollection = userDocRef.collection('foods');
        const snapshot = await foodCollection.get();

        if (snapshot.empty) {
            await userDocRef.set({ initialized: true }, { merge: true });
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
                totalCalories: typeof data.totalCalories === 'number' ? data.totalCalories : (typeof data.calories === 'number' ? data.calories : 0),
                totalProtein: typeof data.totalProtein === 'number' ? data.totalProtein : (typeof data.protein === 'number' ? data.protein : 0),
                totalCarbs: typeof data.totalCarbs === 'number' ? data.totalCarbs : (typeof data.carbs === 'number' ? data.carbs : 0),
                totalFats: typeof data.totalFats === 'number' ? data.totalFats : (typeof data.fats === 'number' ? data.fats : 0),
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
  { name: 'Merienda', items: [] },
  { name: 'Dinner', items: [] },
  { name: 'Snacks', items: [] },
];

const emptyGoals: UserGoals = {
    calorieGoal: 0,
    proteinGoal: 0,
    carbsGoal: 0,
    fatsGoal: 0,
};

export async function getWeeklyPlanAction(
    userId: string,
    weekDates: Date[],
    profileGoals: UserGoals | null
  ): Promise<WeeklyPlan> {
    try {
      const db = getDb();
      const plansCollection = db.collection("users").doc(userId).collection("dailyPlans");
      const dateStrings = weekDates.map((d) => getDateKey(d)); // ✅ usa helper
  
      console.log("📥 Leyendo plan semanal de Firestore:", dateStrings);
  
      const planPromises = dateStrings.map(async (dateString) => {
        const docRef = plansCollection.doc(dateString);
        const docSnap = await docRef.get();
  
        if (docSnap.exists) {
          const data = docSnap.data();
          console.log(`📄 Data encontrada para ${dateString}:`, data);
  
          const goals =
            data?.goals && data.goals.calorieGoal > 0
              ? data.goals
              : profileGoals || emptyGoals;
  
          return {
            date: dateString,
            plan: (data?.plan || initialDailyPlan) as DailyPlan,
            goals: goals as UserGoals,
          };
        }
  
        return {
          date: dateString,
          plan: initialDailyPlan,
          goals: profileGoals || emptyGoals,
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
  


export async function saveDailyPlanAction(
    userId: string,
    date: Date,
    plan: DailyPlan,
    goals: UserGoals
  ): Promise<void> {
    try {
      const db = getDb();
      const dateString = getDateKey(date); // ✅ usa helper
      console.log("📤 Guardando en Firestore:", userId, dateString);
  
      const docRef = db
        .collection("users")
        .doc(userId)
        .collection("dailyPlans")
        .doc(dateString);
  
      const plainPlanObject = JSON.parse(JSON.stringify(plan));
      const plainGoalsObject = JSON.parse(JSON.stringify(goals));
  
      await docRef.set(
        {
          plan: plainPlanObject,
          goals: plainGoalsObject,
        },
        { merge: true }
      );
  
      console.log("✅ Guardado exitoso en Firestore", dateString);
    } catch (error) {
      console.error("🔥 Error al guardar el plan:", error);
      throw new Error("No se pudo guardar el plan diario.");
    }
  }
  



// Weight History
export async function addWeightEntryAction(userId: string, weightEntry: Omit<WeeklyWeightEntry, 'id'>): Promise<{entry: WeeklyWeightEntry, updated: boolean}> {
    try {
        const db = getDb();
        const weightCollection = db.collection('users').doc(userId).collection('weightHistory');
        const entryDate = new Date(weightEntry.date);
        
        const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(entryDate, { weekStartsOn: 1 });

        const query = weightCollection
            .where('date', '>=', admin.firestore.Timestamp.fromDate(weekStart))
            .where('date', '<=', admin.firestore.Timestamp.fromDate(weekEnd));

        const snapshot = await query.get();

        if (snapshot.empty) {
            const dataToSave = {
                weight: weightEntry.weight,
                date: admin.firestore.Timestamp.fromDate(weekStart), 
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


// --- Professional Dashboard Actions ---

export async function checkClientSlotAction(professionalId: string): Promise<{ available: boolean; error?: string }> {
    try {
        const db = getDb();
        const professionalDoc = await db.collection('users').doc(professionalId).get();
        if (!professionalDoc.exists) {
            return { available: false, error: 'El profesional especificado no existe.' };
        }
        const professionalData = professionalDoc.data();
        const paidSlots = professionalData?.paidClientSlots || 0;
        
        const clientsSnapshot = await db.collection('clients')
            .where('professionalId', '==', professionalId)
            .where('status', '==', 'active')
            .get();

        const activeClientsCount = clientsSnapshot.size;
        
        const FREE_SLOTS = 2;
        const totalSlots = FREE_SLOTS + paidSlots;

        if (activeClientsCount >= totalSlots) {
             return { available: false, error: `El profesional ha alcanzado su límite de clientes. Por favor, pídale que compre un nuevo cupo.` };
        }
        
        return { available: true };

    } catch (error) {
        console.error("🔥 Error al verificar el cupo de cliente:", error);
        return { available: false, error: "No se pudo verificar la disponibilidad de cupos en el servidor." };
    }
}

export async function getClientsAction(professionalId: string): Promise<{ data: Client[] | null; error: string | null }> {
  try {
    const db = getDb();
    const clientsSnapshot = await db.collection('clients').where('professionalId', '==', professionalId).get();
    
    if (clientsSnapshot.empty) {
      return { data: [], error: null };
    }
    
    const clients: Client[] = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: data.id, 
            email: data.email,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            status: data.status,
            invitationDate: data.invitationDate,
            professionalId: data.professionalId,
        };
    });
    
    return { data: clients, error: null };
  } catch (error) {
    console.error("🔥 Error al obtener clientes:", error);
    return { data: null, error: "No se pudieron obtener los clientes." };
  }
}

export async function acceptInvitationAction(
    professionalId: string,
    clientUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!clientUser.email) {
            return { success: false, error: 'La cuenta de usuario no tiene un email asociado.' };
        }

        const db = getDb();
        
        const clientRef = db.collection('clients').doc(clientUser.email);
        const clientDoc = await clientRef.get();

        if (clientDoc.exists && clientDoc.data()?.professionalId !== professionalId) {
             return { success: false, error: 'Este cliente ya está asociado con otro profesional.' };
        }
        
        const newClientData: Client = {
            id: clientUser.uid,
            email: clientUser.email,
            displayName: clientUser.displayName,
            photoURL: clientUser.photoURL,
            status: 'active',
            invitationDate: new Date().toISOString(),
            professionalId,
        };

        await clientRef.set(newClientData, { merge: true });
        
        revalidatePath('/pro-dashboard');

        return { success: true };

    } catch (error) {
        console.error("🔥 Error al aceptar la invitación:", error);
        return { success: false, error: "No se pudo procesar la invitación en el servidor." };
    }
}

export async function activateClientSlotAction(professionalId: string): Promise<{ success: boolean, error?: string }> {
    if (!professionalId) {
        return { success: false, error: 'Falta el ID del profesional.' };
    }

    try {
        const db = getDb();
        const professionalRef = db.collection('users').doc(professionalId);
        
        await professionalRef.set({
            paidClientSlots: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
        
        console.log(`✅ Cupo de cliente pagado activado para el profesional ${professionalId}.`);
        revalidatePath('/pro-dashboard');
        return { success: true };

    } catch (error) {
        console.error(`🔥 Error al activar el cupo de cliente para ${professionalId}:`, error);
        return { success: false, error: 'Error del servidor al activar el cupo.' };
    }
}


// --- Chat Actions ---

export async function sendMessageAction(
  chatRoomId: string,
  message: { text: string; senderId: string }
): Promise<{ success: boolean; error?: string }> {
  if (!chatRoomId || !message.text || !message.senderId) {
    return { success: false, error: 'Faltan datos para enviar el mensaje.' };
  }

  try {
    const db = getDb();
    const chatRoomRef = db.collection('chats').doc(chatRoomId);
    const messagesCollection = chatRoomRef.collection('messages');
    
    await messagesCollection.add({
      ...message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('🔥 Error al enviar mensaje:', error);
    return { success: false, error: 'No se pudo enviar el mensaje.' };
  }
}

export async function getProfessionalForClientAction(clientId: string): Promise<{ professionalId: string | null; error?: string }> {
  try {
    const db = getDb();
    const clientsSnapshot = await db.collection('clients').where('id', '==', clientId).limit(1).get();

    if (clientsSnapshot.empty) {
      return { professionalId: null, error: 'No estás asociado a ningún profesional.' };
    }

    const clientData = clientsSnapshot.docs[0].data();
    return { professionalId: clientData.professionalId };

  } catch (error) {
    console.error('🔥 Error al buscar profesional:', error);
    return { professionalId: null, error: 'No se pudo encontrar a tu profesional.' };
  }
}

    

    