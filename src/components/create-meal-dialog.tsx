
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
import { useToast } from '@/hooks/use-toast';


interface CreateMealDialogProps {
  onCreateMeal: (meal: Omit<CustomMeal, 'id'>) => void;
  foodDatabase: FoodItem[];
  setFoodDatabase: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

export default function CreateMealDialog({ onCreateMeal, foodDatabase, setFoodDatabase }: CreateMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [creationMode, setCreationMode] = useState<'ingredients' | 'totals'>('ingredients');
  const { toast } = useToast();

  // Manual totals state
  const [manualCalories, setManualCalories] = useState<number | ''>('');
  const [manualProtein, setManualProtein] = useState<number | ''>('');
  const [manualCarbs, setManualCarbs] = useState<number | ''>('');
  const [manualFats, setManualFats] = useState<number | ''>('');
  const [manualServingSize, setManualServingSize] = useState<number | ''>(1);
  const [manualServingUnit, setManualServingUnit] = useState('serving');


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
          const ratio = (item.quantity > 0 && item.servingSize > 0) ? item.quantity / item.servingSize : 0;
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
    if (!mealName.trim()) return;

    if (creationMode === 'ingredients' && selectedItems.length > 0) {
        const mealItemsForDb = selectedItems.map(item => {
            const cleanItem: MealItem = {
                id: item.id,
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fats: item.fats,
                servingSize: item.servingSize,
                servingUnit: item.servingUnit,
                mealItemId: crypto.randomUUID(), 
                quantity: item.quantity,
            };
            return cleanItem;
        });

        const newMealData: Omit<CustomMeal, 'id'> = {
            name: mealName,
            items: mealItemsForDb,
            totalCalories: totalsFromIngredients.totalCalories,
            totalProtein: totalsFromIngredients.totalProtein,
            totalCarbs: totalsFromIngredients.totalCarbs,
            totalFats: totalsFromIngredients.totalFats,
        };
        onCreateMeal(newMealData);
        resetState();
    } else if (creationMode === 'totals' && manualCalories !== '' && manualProtein !== '' && manualCarbs !== '' && manualFats !== '' && manualServingSize !== '' && manualServingUnit !== '') {
         const newMealData: Omit<CustomMeal, 'id'> = {
            name: mealName,
            items: [], 
            totalCalories: Number(manualCalories),
            totalProtein: Number(manualProtein),
            totalCarbs: Number(manualCarbs),
            totalFats: Number(manualFats),
            servingSize: Number(manualServingSize) || 1,
            servingUnit: manualServingUnit || 'serving',
        };
        onCreateMeal(newMealData);
        resetState();
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
    setManualServingSize(1);
    setManualServingUnit('serving');
  }

  const handleAddIngredient = async (newIngredientData: Omit<FoodItem, 'id'>): Promise<FoodItem | null> => {
    try {
        const res = await fetch('/api/foods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIngredientData),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.details || "Failed to save ingredient");
        }
        
        const newIngredient: FoodItem = await res.json();
        
        // Update local state and add to current meal
        setFoodDatabase(prev => [...prev, newIngredient]);
        addFoodToMeal(newIngredient);

        toast({
            title: "Ingredient Saved!",
            description: `${newIngredient.name} has been added to the database.`,
        });

        return newIngredient;
    } catch (error) {
        console.error("Failed to save ingredient:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Error Saving Ingredient",
          description: `Could not save to database: ${errorMessage}`,
        });
        return null;
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetState();
    }
    setOpen(isOpen);
  }

  const isIngredientsFormValid = mealName.trim() && selectedItems.length > 0;
  const isTotalsFormValid = mealName.trim() && manualCalories !== '' && manualProtein !== '' && manualCarbs !== '' && manualFats !== '' && manualServingSize !== '' && manualServingUnit !== '';
  const isFormValid = creationMode === 'ingredients' ? isIngredientsFormValid : isTotalsFormValid;


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <UtensilsCrossed className="mr-2"/>
            Create a Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create a New Meal</DialogTitle>
           <DialogDescription>
             Compose a meal from ingredients or enter the nutritional totals directly. This will be saved to your database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow py-4 overflow-y-auto">
            <div className="space-y-4 px-1">
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
                      <ScrollArea className="h-96 pr-4">
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
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="totals" className="pt-4">
                      <ScrollArea className="h-96 pr-4">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Enter the nutritional values per serving.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manualServingSize">Serving Size</Label>
                                    <Input id="manualServingSize" type="number" value={manualServingSize} onChange={(e) => setManualServingSize(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manualServingUnit">Unit</Label>
                                    <Input id="manualServingUnit" value={manualServingUnit} onChange={(e) => setManualServingUnit(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="calories">Calories (kcal)</Label>
                                    <Input id="calories" type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="protein">Protein (g)</Label>
                                    <Input id="protein" type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="carbs">Carbs (g)</Label>
                                    <Input id="carbs" type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fats">Fats (g)</Label>
                                    <Input id="fats" type="number" value={manualFats} onChange={(e) => setManualFats(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                            </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
       
        <DialogFooter className="border-t pt-4 mt-auto">
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
