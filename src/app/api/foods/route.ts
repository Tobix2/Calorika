import { NextResponse } from 'next/server';
import { addFood } from '@/services/foodServerActions';
import { auth } from 'firebase-admin';
import { initAdminApp } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
initAdminApp();

async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error("Error verifying ID token:", error);
            return null;
        }
    }
    return null;
}

export async function POST(req: Request) {
  console.log("🟢 POST /api/foods - La ruta ha sido llamada.");
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const food = await req.json();
    console.log("✅ Datos recibidos y parseados del cliente:", food);

    // Firestore no puede manejar 'undefined', nos aseguramos de que el objeto esté limpio.
    const cleanFood = JSON.parse(JSON.stringify(food));
    console.log("🧼 Objeto de comida limpiado para Firestore:", cleanFood);
    
    console.log("⏳ Intentando añadir el documento a la colección 'foods' para el usuario:", userId);
    const newFood = await addFood(userId, cleanFood);
    console.log("✅ Documento añadido a Firestore con éxito. ID:", newFood.id);

    return NextResponse.json(newFood, { status: 201 });
  } catch (error) {
    console.error("❌ ERROR en POST /api/foods:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ error: 'Failed to add food', details: errorMessage }, { status: 500 });
  } finally {
    console.log("🔴 POST /api/foods - Fin de la ejecución de la ruta.");
  }
}
