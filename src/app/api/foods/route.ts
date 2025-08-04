import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { FoodItem } from '@/lib/types';

export async function POST(req: Request) {
  console.log("🟢 POST /api/foods - La ruta ha sido llamada.");
  try {
    const food: Omit<FoodItem, 'id'> = await req.json();
    console.log("✅ Datos recibidos y parseados del cliente:", food);

    // Firestore no puede manejar 'undefined', nos aseguramos de que el objeto esté limpio.
    const cleanFood = JSON.parse(JSON.stringify(food));
    console.log("🧼 Objeto de comida limpiado para Firestore:", cleanFood);

    const foodCollection = collection(db, 'foods');
    console.log("⏳ Intentando añadir el documento a la colección 'foods'...");
    
    const docRef = await addDoc(foodCollection, cleanFood);
    console.log("✅ Documento añadido a Firestore con éxito. ID:", docRef.id);

    return NextResponse.json({ id: docRef.id, ...cleanFood }, { status: 201 });
  } catch (error) {
    console.error("❌ ERROR en POST /api/foods:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ error: 'Failed to add food', details: errorMessage }, { status: 500 });
  } finally {
    console.log("🔴 POST /api/foods - Fin de la ejecución de la ruta.");
  }
}
