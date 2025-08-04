'use server';

import { db } from '@/lib/firebase';
import type { FoodItem } from '@/lib/types';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';

function getFoodCollection(userId: string) {
    if (!userId) throw new Error("User ID is required for server actions.");
    return collection(db, 'users', userId, 'foods');
}

export async function addFood(userId: string, food: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const foodCollection = getFoodCollection(userId);
    try {
        const cleanFood = JSON.parse(JSON.stringify(food));
        const docRef = await addDoc(foodCollection, cleanFood);
        return { id: docRef.id, ...cleanFood };
    } catch (error) {
        console.error("Error adding document to Firestore: ", error);
        if (error instanceof Error) {
            throw new Error(`Firestore error: ${error.message}`);
        }
        throw new Error('An unknown error occurred while saving to Firestore.');
    }
}

export async function deleteFood(userId: string, foodId: string): Promise<void> {
    if (!foodId) throw new Error("Food ID is required.");
    console.log(`[Server Action] Intentando borrar el FoodItem con ID: ${foodId} para el usuario ${userId}`);
    const foodDocRef = doc(db, 'users', userId, 'foods', foodId);
    try {
        await deleteDoc(foodDocRef);
        console.log(`[Server Action] FoodItem con ID: ${foodId} borrado exitosamente.`);
    } catch (error) {
        console.error("Error deleting document from Firestore: ", error);
        if (error instanceof Error) {
            throw new Error(`Firestore error: ${error.message}`);
        }
        throw new Error('An unknown error occurred while deleting from Firestore.');
    }
}
