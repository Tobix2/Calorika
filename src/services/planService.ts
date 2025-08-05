'use server';

import { getFirestoreDb } from '@/lib/firebase-admin';
import type { WeeklyPlan } from '@/lib/types';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const initialWeeklyPlan: WeeklyPlan = daysOfWeek.reduce((acc, day) => {
  acc[day] = [
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snacks', items: [] },
  ];
  return acc;
}, {} as WeeklyPlan);

function getPlanDocRef(userId: string) {
  if (!userId) throw new Error("User ID is required for server actions.");
  const db = getFirestoreDb(); // ✅ Firebase se inicializa aquí, no antes
  return db.doc(`users/${userId}/plans/weekly`);
}

export async function getWeeklyPlan(userId: string): Promise<WeeklyPlan> {
  const docRef = getPlanDocRef(userId);
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data() as WeeklyPlan;
    } else {
      await docRef.set(initialWeeklyPlan);
      return initialWeeklyPlan;
    }
  } catch (error) {
    console.error("🔥 Error al obtener el weekly plan:", error);
    throw new Error("Failed to fetch weekly plan.");
  }
}

export async function saveWeeklyPlan(userId: string, plan: WeeklyPlan): Promise<void> {
  const docRef = getPlanDocRef(userId);
  try {
    const plainPlanObject = JSON.parse(JSON.stringify(plan));
    await docRef.set(plainPlanObject, { merge: true });
  } catch (error) {
    console.error("🔥 Error al guardar el weekly plan:", error);
    throw new Error("Failed to save weekly plan.");
  }
}
