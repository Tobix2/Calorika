'use server';

import {
  getCalorieRecommendation,
  type CalorieRecommendationInput,
  type CalorieRecommendationOutput,
} from '@/ai/flows/calorie-recommendation';
import {
  generateMealPlan,
} from '@/ai/flows/generate-meal-plan';
import type { GenerateMealPlanInput, GenerateMealPlanOutput, FoodItem, CustomMeal, WeeklyPlan, DailyPlan } from '@/lib/types';
import { db } from '@/lib/firebase-admin';
import { collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';

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
    activityLevel: formData.get('activityLevel') || 'lightlyActive',
    goal: formData.get('goal') || 'maintainWeight',
  };

  try {
    const result = await getCalorieRecommendation(rawFormData as CalorieRecommendationInput);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { data: null, error: `Failed to get recommendation: ${errorMessage}` };
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
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to generate meal plan: ${errorMessage}` };
    }
}

// --- Firestore Actions ---

// Foods
async function populateInitialFoods(userId: string): Promise<FoodItem[]> {
    const initialFoods: Omit<FoodItem, 'id'>[] = [
      { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, servingSize: 1, servingUnit: 'medium' },
      { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, servingSize: 1, servingUnit: 'medium' },
      { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g' },
      { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, servingSize: 100, servingUnit: 'g cooked' },
      { name: 'Whole Egg', calories: 78, protein: 6, carbs: 0.6, fats: 5, servingSize: 1, servingUnit: 'large' },
      { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 49, servingSize: 100, servingUnit: 'g' },
      { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g' },
      { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
      { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, servingSize: 1, servingUnit: 'cup' },
      { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'g' },
      { name: 'Oats', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, servingSize: 100, servingUnit: 'g' },
      { name: 'Protein Powder', calories: 393, protein: 80, carbs: 8, fats: 4, servingSize: 100, servingUnit: 'g' },
    ];

    const foodCollection = collection(db, 'users', userId, 'foods');
    const addedFoods: FoodItem[] = [];
    for (const food of initialFoods) {
        const docId = food.name.toLowerCase().replace(/\s+/g, '-');
        const docRef = doc(foodCollection, docId);
        await setDoc(docRef, food);
        addedFoods.push({ id: docId, ...food });
    }
    return addedFoods;
}

export async function getFoodsAction(userId: string): Promise<FoodItem[]> {
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, { initialized: true }); // Mark user as initialized
            return await populateInitialFoods(userId);
        }

        const foodCollection = collection(db, 'users', userId, 'foods');
        const snapshot = await getDocs(foodCollection);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Unnamed Food',
                calories: data.calories || 0,
                protein: data.protein || 0,
                carbs: data.carbs || 0,
                fats: data.fats || 0,
                servingSize: data.servingSize || 1,
                servingUnit: data.servingUnit || 'unit',
            } as FoodItem;
        });
    } catch (error) {
        console.error("🔥 Error fetching foods from Firestore:", error);
        throw new Error("Failed to fetch foods.");
    }
}

export async function addFoodAction(userId: string, food: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const foodCollection = collection(db, 'users', userId, 'foods');
    try {
        const cleanFood = JSON.parse(JSON.stringify(food));
        const docRef = await addDoc(foodCollection, cleanFood);
        return { id: docRef.id, ...cleanFood };
    } catch (error) {
        console.error("🔥 Error adding document to Firestore: ", error);
        throw new Error('Failed to add food.');
    }
}

export async function deleteFoodAction(userId: string, foodId: string): Promise<void> {
    if (!foodId) throw new Error("Food ID is required.");
    const foodDocRef = doc(db, 'users', userId, 'foods', foodId);
    try {
        await deleteDoc(foodDocRef);
    } catch (error) {
        console.error("🔥 Error deleting document from Firestore: ", error);
        throw new Error('Failed to delete food.');
    }
}

// Custom Meals
export async function getCustomMealsAction(userId: string): Promise<CustomMeal[]> {
    const mealCollection = collection(db, 'users', userId, 'customMeals');
    try {
        const snapshot = await getDocs(mealCollection);
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
                servingUnit: data.servingUnit || 'serving',
            } as CustomMeal;
        });
    } catch (error) {
        console.error("🔥 Error fetching custom meals from Firestore:", error);
        throw new Error("Failed to fetch custom meals.");
    }
}

export async function addCustomMealAction(userId: string, meal: Omit<CustomMeal, 'id'>): Promise<CustomMeal> {
    const mealCollection = collection(db, 'users', userId, 'customMeals');
    try {
        const cleanMeal = JSON.parse(JSON.stringify(meal));
        const docRef = await addDoc(mealCollection, cleanMeal);
        return { id: docRef.id, ...cleanMeal };
    } catch (error) {
        console.error("🔥 Error adding custom meal to Firestore: ", error);
        throw new Error('Failed to add custom meal.');
    }
}

export async function deleteCustomMealAction(userId: string, mealId: string): Promise<void> {
    if (!mealId) throw new Error("Meal ID is required.");
    const mealDocRef = doc(db, 'users', userId, 'customMeals', mealId);
    try {
        await deleteDoc(mealDocRef);
    } catch (error) {
        console.error("🔥 Error deleting custom meal from Firestore: ", error);
        throw new Error('Failed to delete custom meal.');
    }
}

// Weekly Plan
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const initialDailyPlan: WeeklyPlan = daysOfWeek.reduce((acc, day) => {
  acc[day] = [
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snacks', items: [] },
  ];
  return acc;
}, {} as WeeklyPlan);

export async function getWeeklyPlanAction(userId: string): Promise<WeeklyPlan> {
  const docRef = doc(db, 'users', userId, 'plans', 'weekly');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as WeeklyPlan;
    } else {
      await setDoc(docRef, initialDailyPlan);
      return initialDailyPlan;
    }
  } catch (error) {
    console.error("🔥 Error al obtener el weekly plan:", error);
    throw new Error("Failed to fetch weekly plan.");
  }
}

export async function saveWeeklyPlanAction(userId: string, plan: WeeklyPlan): Promise<void> {
  const docRef = doc(db, 'users', userId, 'plans', 'weekly');
  try {
    const plainPlanObject = JSON.parse(JSON.stringify(plan));
    await setDoc(docRef, plainPlanObject, { merge: true });
  } catch (error) {
    console.error("🔥 Error al guardar el weekly plan:", error);
    throw new Error("Failed to save weekly plan.");
  }
}