import { NextResponse } from 'next/server';
import { addFood } from '@/services/foodServerActions';
import type { FoodItem } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const food: Omit<FoodItem, 'id'> = await req.json();
    const newFood = await addFood(food);
    return NextResponse.json(newFood, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/foods:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add food', details: errorMessage }, { status: 500 });
  }
}
