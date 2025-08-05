
'use server';

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


function getPlanDocRef(userId: string) {
    if (!userId) throw new Error("User ID is required for server actions.");
    // Store the entire weekly plan in a single document for efficiency.
    return doc(db, 'users', userId, 'plans', 'weekly');
}

export async function getWeeklyPlan(userId: string): Promise<WeeklyPlan> {
    const planDocRef = getPlanDocRef(userId);
    try {
        const docSnap = await getDoc(planDocRef);
        if (docSnap.exists()) {
            // Firestore data is plain objects, so we cast it to our type.
            // Add validation here if needed (e.g., with Zod) for more robustness.
            return docSnap.data() as WeeklyPlan;
        } else {
            // If the user has no plan, save an initial empty plan for them.
            await setDoc(planDocRef, initialWeeklyPlan);
            return initialWeeklyPlan;
        }
    } catch (error) {
        console.error("Error fetching weekly plan from Firestore:", error);
        throw new Error("Failed to fetch weekly plan.");
    }
}

export async function saveWeeklyPlan(userId: string, plan: WeeklyPlan): Promise<void> {
    const planDocRef = getPlanDocRef(userId);
    try {
        // Use setDoc with merge: true to update or create the document without overwriting.
        // However, since we're saving the whole plan object, a simple setDoc is fine.
        // We need to convert our object to a plain JS object for Firestore.
        const plainPlanObject = JSON.parse(JSON.stringify(plan));
        await setDoc(planDocRef, plainPlanObject);
    } catch (error) {
        console.error("Error saving weekly plan to Firestore:", error);
        throw new Error("Failed to save weekly plan.");
    }
}

    