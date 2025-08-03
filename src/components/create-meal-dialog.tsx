
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FoodItem, CustomMeal, MealItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, UtensilsCrossed, Trash2 } from 'lucide-react';
import AddIngredientDialog from './add-ingredient-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const MOCK_FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, servingSize: 1, servingUnit: 'medium' },
  { id: '2', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, servingSize: 1, servingUnit: 'medium' },
  { id: '3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: '4', name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, servingSize: 100, servingUnit: 'g cooked' },
  { id: '5', name: 'Whole Egg', calories: 78, protein: 6, carbs: 0.6, fats: 5, servingSize: 1, servingUnit: 'large' },
  { id: '6', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 49, servingSize: 100, servingUnit: 'g' },
  { id: '7', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: '8', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: '9', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, servingSize: 1, servingUnit: 'cup' },
  { id: '10', name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'g' },
  { id: '11', name: 'Oats', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, servingSize: 100, servingUnit: 'g' },
  { id: '12', name: 'Protein Powder', calories: 393, protein: 80, carbs: 8, fats: 4, servingSize: 100, servingUnit: 'g' },
];

interface CreateMealDialogProps {
  onCreateMeal: (meal: CustomMeal) => void;
}

export default function CreateMealDialog({ onCreateMeal }: CreateMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(MOCK_FOOD_DATABASE);
  const [creationMode, setCreationMode] = useState<'ingredients' | 'totals'>('ingredients');

  // Manual totals state
  const [manualCalories, setManualCalories] = useState<number | ''>('');
  const [manualProtein, setManualProtein] = useState<number | ''>('');
  const [manualCarbs, setManualCarbs] = useState<number | ''>('');
  const [manualFats, setManualFats] = useState<number | ''>('');


  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addFoodToMeal = (food: FoodItem) => {
    const newItem: MealItem = {
      ...food,
      mealItemId: crypto.randomUUID(),
      quantity: food.servingSize,
    };
    setSelectedItems(prev => [...prev, newItem]);
  };

  const removeFoodFromMeal = (mealItemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.mealItemId !== mealItemId));
  }

  const updateItemQuantity = (mealItemId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.mealItemId === mealItemId ? { ...item, quantity: quantity || 0 } : item
      )
    );
  };

  const totalsFromIngredients = useMemo(() => {
    return selectedItems.reduce(
        (acc, item) => {
          const ratio = item.quantity / item.servingSize;
          acc.totalCalories += item.calories * ratio;
          acc.totalProtein += item.protein * ratio;
          acc.totalCarbs += item.carbs * ratio;
          acc.totalFats += item.fats * ratio;
          return acc;
        },
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
      );
  }, [selectedItems]);


  const handleCreateMeal = () => {
    if (mealName.trim()) {
        if (creationMode === 'ingredients' && selectedItems.length > 0) {
            const newMeal: CustomMeal = {
                id: crypto.randomUUID(),
                name: mealName,
                items: selectedItems.map(item => ({...item, mealItemId: crypto.randomUUID()})),
                ...totalsFromIngredients
            };
            onCreateMeal(newMeal);
            resetState();
        } else if (creationMode === 'totals' && manualCalories !== '' && manualProtein !== '' && manualCarbs !== '' && manualFats !== '') {
             const newMeal: CustomMeal = {
                id: crypto.randomUUID(),
                name: mealName,
                items: [], // No ingredients for manual entry
                totalCalories: Number(manualCalories),
                totalProtein: Number(manualProtein),
                totalCarbs: Number(manualCarbs),
                totalFats: Number(manualFats),
            };
            onCreateMeal(newMeal);
            resetState();
        }
    }
  };
  
  const resetState = () => {
    setOpen(false);
    setMealName('');
    setSelectedItems([]);
    setSearchTerm('');
    setCreationMode('ingredients');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
  }


  const handleAddIngredient = (newIngredient: FoodItem) => {
    setFoodDatabase(prev => [...prev, newIngredient]);
    addFoodToMeal(newIngredient);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetState();
    }
    setOpen(isOpen);
  }

  const isIngredientsFormValid = mealName.trim() && selectedItems.length > 0;
  const isTotalsFormValid = mealName.trim() && manualCalories !== '' && manualProtein !== '' && manualCarbs !== '' && manualFats !== '';
  const isFormValid = creationMode === 'ingredients' ? isIngredientsFormValid : isTotalsFormValid;


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <UtensilsCrossed className="mr-2"/>
            Create a Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Meal</DialogTitle>
           <DialogDescription>
             Compose a meal from ingredients or enter the nutritional totals directly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input
                    id="meal-name"
                    placeholder="e.g., Post-Workout Shake"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                />
            </div>

            <Tabs value={creationMode} onValueChange={(value) => setCreationMode(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ingredients">From Ingredients</TabsTrigger>
                    <TabsTrigger value="totals">Enter Totals</TabsTrigger>
                </TabsList>
                <TabsContent value="ingredients" className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Ingredients</Label>
                            <AddIngredientDialog onAddIngredient={handleAddIngredient}>
                                <Button variant="link" size="sm" className="p-0 h-auto">
                                    Add New
                                </Button>
                            </AddIngredientDialog>
                        </div>
                        <Input
                            placeholder="Search for an ingredient..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mb-2"
                        />
                        <ScrollArea className="h-40 rounded-md border">
                            <div className="p-2 space-y-1">
                            {filteredFoods.map(food => (
                                <div
                                    key={food.id}
                                    className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted"
                                    onClick={() => addFoodToMeal(food)}
                                >
                                    <div>
                                        <p className="font-semibold">{food.name}</p>
                                        <p className="text-sm text-muted-foreground">{food.calories} kcal / {food.servingSize} {food.servingUnit}</p>
                                    </div>
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Selected Ingredients</Label>
                        {selectedItems.length > 0 ? (
                            <ScrollArea className="h-40 rounded-md border">
                                <div className="p-2 space-y-2">
                                {selectedItems.map(item => (
                                    <div key={item.mealItemId} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                            {(item.calories * (item.quantity / item.servingSize)).toFixed(0)} kcal
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItemQuantity(item.mealItemId, parseFloat(e.target.value))}
                                            className="w-20 h-8"
                                            min="0"
                                            />
                                            <span className="text-sm text-muted-foreground">{item.servingUnit}</span>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeFoodFromMeal(item.mealItemId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                Search and click on an ingredient to add it.
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="totals" className="space-y-4 pt-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="calories">Calories (kcal)</Label>
                            <Input id="calories" type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="protein">Protein (g)</Label>
                            <Input id="protein" type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="carbs">Carbs (g)</Label>
                            <Input id="carbs" type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fats">Fats (g)</Label>
                            <Input id="fats" type="number" value={manualFats} onChange={(e) => setManualFats(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
       
        <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreateMeal} disabled={!isFormValid}>
                <Plus className="mr-2" />
                Create Meal ({creationMode === 'ingredients' ? totalsFromIngredients.totalCalories.toFixed(0) : Number(manualCalories || 0).toFixed(0)} kcal)
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
