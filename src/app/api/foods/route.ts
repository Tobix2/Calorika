import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { FoodItem } from '@/lib/types';

export async function POST(req: Request) {
  console.log("🟢 POST /api/foods - start");
  try {
    const food: Omit<FoodItem, 'id'> = await req.json();
    console.log("✅ Parsed food from request:", food);

    const cleanFood = JSON.parse(JSON.stringify(food));
    console.log("✅ Cleaned food:", cleanFood);

    const foodCollection = collection(db, 'foods');
    console.log("✅ Got Firestore collection reference");

    // Aquí chequeamos que no esté colgado addDoc
    console.log("⏳ Adding document to Firestore...");
    const docRef = await addDoc(foodCollection, cleanFood);
    console.log("✅ Document added with ID:", docRef.id);

    return NextResponse.json({ id: docRef.id, ...cleanFood }, { status: 201 });
  } catch (error) {
    console.error("❌ Error in POST /api/foods:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add food', details: errorMessage }, { status: 500 });
  } finally {
    console.log("🔴 POST /api/foods - end");
  }
}
