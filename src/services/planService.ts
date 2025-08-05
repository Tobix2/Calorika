
'use server';

import { db } from '@/lib/firebase';
import type { WeeklyPlan } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Se define una estructura inicial para el plan semanal de un nuevo usuario.
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
    // Para eficiencia, todo el plan semanal de un usuario se almacena en un único documento.
    // La ruta es: /users/{userId}/plans/weekly
    return doc(db, 'users', userId, 'plans', 'weekly');
}

/**
 * Obtiene el plan semanal de un usuario desde Firestore.
 * Si el usuario no tiene un plan, crea y guarda uno inicial vacío.
 * @param userId - El ID del usuario para el cual se obtendrá el plan.
 * @returns Una promesa que se resuelve con el objeto WeeklyPlan del usuario.
 */
export async function getWeeklyPlan(userId: string): Promise<WeeklyPlan> {
    const planDocRef = getPlanDocRef(userId);
    try {
        const docSnap = await getDoc(planDocRef);
        if (docSnap.exists()) {
            // Si el documento del plan existe, se devuelve su contenido.
            // Se realiza un casting al tipo WeeklyPlan.
            return docSnap.data() as WeeklyPlan;
        } else {
            // Si el documento no existe (usuario nuevo), se crea uno vacío.
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
 * Esta función sobrescribe cualquier plan existente con la nueva versión proporcionada.
 * @param userId - El ID del usuario cuyo plan se va a guardar.
 * @param plan - El objeto WeeklyPlan completo que se va to guardar.
 * @returns Una promesa que se resuelve cuando la operación de guardado se completa.
 */
export async function saveWeeklyPlan(userId: string, plan: WeeklyPlan): Promise<void> {
    const planDocRef = getPlanDocRef(userId);
    try {
        // Para asegurar la compatibilidad con Firestore, que solo acepta objetos planos,
        // se convierte el objeto `plan` a un objeto JavaScript simple.
        const plainPlanObject = JSON.parse(JSON.stringify(plan));
        await setDoc(planDocRef, plainPlanObject);
    } catch (error) {
        console.error("Error saving weekly plan to Firestore:", error);
        throw new Error("Failed to save weekly plan.");
    }
}
