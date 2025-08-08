
"use client";

import type { Meal, MealName, FoodItem, CustomMeal, MealItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddFoodDialog from './add-food-dialog';
import { Apple, Salad, Drumstick, Cookie, Flame, Trash2, PlusCircle, Beef, Wheat, Droplets } from 'lucide-react';

interface MealListProps {
  meals: Meal[];
  customMeals: CustomMeal[];
  foodDatabase: FoodItem[];
  onAddFood: (mealName: MealName, food: FoodItem, quantity: number) => void;
  onAddCustomMeal: (mealName: MealName, customMeal: CustomMeal, servings: number) => void;
  onRemoveFood: (mealName: MealName, mealItemId: string) => void;
  onDeleteItem: (item: FoodItem | CustomMeal) => void;
}

const mealIcons: Record<MealName, React.ReactNode> = {
  Breakfast: <Apple className="h-6 w-6 text-red-500" />,
  Lunch: <Salad className="h-6 w-6 text-green-500" />,
  Dinner: <Drumstick className="h-6 w-6 text-yellow-600" />,
  Snacks: <Cookie className="h-6 w-6 text-orange-400" />,
};

const mealNames: Record<MealName, string> = {
    Breakfast: "Desayuno",
    Lunch: "Almuerzo",
    Dinner: "Cena",
    Snacks: "Snacks"
}

const calculateNutrients = (item: MealItem) => {
    const quantity = Number(item.quantity) || 0;
    const servingSize = Number(item.servingSize) || 1;
    let ratio = servingSize > 0 ? quantity / servingSize : 0;
    
    // For custom meals measured in servings, the ratio is just the quantity
    if (item.isCustom && (item.servingUnit?.toLowerCase().includes('ración') || item.servingUnit?.toLowerCase().includes('serving') || item.servingUnit?.toLowerCase().includes('comida'))) {
        ratio = quantity;
    }
    
    return {
        calories: (item.calories || 0) * ratio,
        protein: (item.protein || 0) * ratio,
        carbs: (item.carbs || 0) * ratio,
        fats: (item.fats || 0) * ratio,
    };
}


export default function MealList({ meals, customMeals, foodDatabase, onAddFood, onRemoveFood, onAddCustomMeal, onDeleteItem }: MealListProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {meals.map(meal => {
        const mealCalories = meal.items.reduce((sum, item) => {
            return sum + calculateNutrients(item).calories;
        }, 0);

        return (
          <Card key={meal.name} className="shadow-md flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {mealIcons[meal.name]}
                <CardTitle className="font-headline text-xl">{mealNames[meal.name]}</CardTitle>
              </div>
              <div className="flex items-center gap-2 font-bold text-lg text-muted-foreground">
                <Flame className="h-5 w-5 text-orange-500" />
                <span>{mealCalories.toFixed(0)}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="space-y-3 mb-4 flex-grow">
                {meal.items.length > 0 ? (
                  meal.items.map((item: MealItem) => {
                     const nutrients = calculateNutrients(item);
                     const quantity = Number(item.quantity) || 0;
                     const unit = item.servingUnit || 'unidad';
                     const servingUnitLabel = quantity !== 1 && unit.length > 2 && !unit.endsWith('s') ? `${unit}s` : unit;

                     const description = `${quantity} ${servingUnitLabel} • ${nutrients.calories.toFixed(0)} kcal`;

                    return (
                        <div key={item.mealItemId} className="flex flex-col bg-muted/50 p-3 rounded-md gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{description}</p>
                                </div>
                                <button onClick={() => onRemoveFood(meal.name, item.mealItemId)} className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-destructive/10 -mt-1 -mr-1">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground border-t border-muted-foreground/20 pt-2">
                                <div className="flex items-center gap-1">
                                    <Beef className="h-3 w-3 text-red-500"/>
                                    <span>P: {nutrients.protein.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wheat className="h-3 w-3 text-yellow-500"/>
                                    <span>C: {nutrients.carbs.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Droplets className="h-3 w-3 text-blue-500"/>
                                    <span>G: {nutrients.fats.toFixed(1)}g</span>
                                </div>
                            </div>
                        </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aún no has registrado nada.</p>
                )}
              </div>
              <AddFoodDialog
                onAddFood={(food, quantity) => onAddFood(meal.name, food, quantity)}
                onAddCustomMeal={(customMeal, servings) => onAddCustomMeal(meal.name, customMeal, servings)}
                customMeals={customMeals}
                foodDatabase={foodDatabase}
                onDeleteItem={onDeleteItem}
              >
                 <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:bg-accent hover:border-accent-foreground hover:text-accent-foreground transition-colors">
                    <PlusCircle className="h-4 w-4" />
                    Añadir Alimento
                </button>
              </AddFoodDialog>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
