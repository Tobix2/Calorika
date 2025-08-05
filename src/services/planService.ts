
'use server';
// Este archivo se ejecuta exclusivamente en el servidor.

import { db } from '@/lib/firebase';
import type { WeeklyPlan } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

/**
 * Obtiene una referencia al documento de Firestore donde se guarda el plan semanal del usuario.
 * @param userId - El ID del usuario.
 * @returns Una referencia a un documento de Firestore.
 */
function getPlanDocRef(userId: string) {
    if (!userId) throw new Error("User ID is required for server actions.");
    // La ruta es: /users/{userId}/plans/weekly
    // Toda la información del plan semanal se almacena en un único documento para eficiencia.
    return doc(db, 'users', userId, 'plans', 'weekly');
}

/**
 * Obtiene el plan semanal de un usuario desde Firestore.
 * Si el usuario no tiene un plan, crea y guarda uno inicial vacío.
 * Es llamado por `dashboard.tsx` al cargar la aplicación.
 * @param userId - El ID del usuario.
 * @returns Una promesa que se resuelve con el objeto WeeklyPlan del usuario.
 */
export async function getWeeklyPlan(userId: string): Promise<WeeklyPlan> {
    const planDocRef = getPlanDocRef(userId);
    try {
        const docSnap = await getDoc(planDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as WeeklyPlan;
        } else {
            // Si el documento no existe (usuario nuevo), se crea uno vacío y se retorna.
            await setDoc(planDocRef, initialWeeklyPlan);
            return initialWeeklyPlan;
        }
    } catch (error) {
        console.error("Error fetching weekly plan from Firestore:", error);
        throw new Error("Failed to fetch weekly plan.");
    }
}

/**
 * Guarda el objeto completo del plan semanal de un usuario en Firestore.
 * Esta función es llamada automáticamente por `dashboard.tsx` cada vez que el estado `weeklyPlan` cambia.
 * @param userId - El ID del usuario cuyo plan se va a guardar.
 * @param plan - El objeto WeeklyPlan completo que se va a guardar.
 * @returns Una promesa que se resuelve cuando la operación de guardado se completa.
 */
export async function saveWeeklyPlan(userId: string, plan: WeeklyPlan): Promise<void> {
    // PASO 3: La ejecución llega a este archivo (`planService.ts`) desde `dashboard.tsx`.
    const planDocRef = getPlanDocRef(userId);
    try {
        // PASO 4: Se prepara el objeto para que sea compatible con Firestore y se guarda.
        // `setDoc` sobrescribe el documento existente con los nuevos datos.
        const plainPlanObject = JSON.parse(JSON.stringify(plan));
        await setDoc(planDocRef, plainPlanObject);
        // PASO 5 (implícito): Firestore confirma el guardado y la promesa se resuelve,
        // finalizando el ciclo de guardado.
    } catch (error) {
        console.error("Error saving weekly plan to Firestore:", error);
        throw new Error("Failed to save weekly plan.");
    }
}
