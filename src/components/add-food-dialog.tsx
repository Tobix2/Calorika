"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { FoodItem, CustomMeal } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

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

interface AddFoodDialogProps {
  customMeals: CustomMeal[];
  onAddFood: (food: FoodItem, quantity: number) => void;
  onAddCustomMeal: (meal: CustomMeal, servings: number) => void;
  children: React.ReactNode;
}

export default function AddFoodDialog({ onAddFood, onAddCustomMeal, customMeals, children }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);
  const [selectedItem, setSelectedItem] = useState<FoodItem | CustomMeal | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);

  const filteredFoods = MOCK_FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomMeals = customMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetAndClose = () => {
    setOpen(false);
    setSearchTerm('');
    setStep(1);
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleSelect = (item: FoodItem | CustomMeal) => {
    setSelectedItem(item);
    if ('servingUnit' in item) { // It's a FoodItem
        setQuantity(item.servingSize);
    } else { // It's a CustomMeal
        setQuantity(1);
    }
    setStep(2);
  };
  
  const handleConfirmAdd = () => {
    if (selectedItem) {
        if ('servingUnit' in selectedItem) { // FoodItem
            onAddFood(selectedItem, Number(quantity));
        } else { // CustomMeal
            onAddCustomMeal(selectedItem, Number(quantity));
        }
        resetAndClose();
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetAndClose();
    }
    setOpen(isOpen);
  }

  const isCustomMeal = selectedItem && !('servingUnit' in selectedItem);
  const unitLabel = isCustomMeal ? 'serving(s)' : (selectedItem as FoodItem)?.servingUnit;
  const servingInfo = isCustomMeal ? `1 serving = ${(selectedItem as CustomMeal)?.totalCalories.toFixed(0)} kcal` : `1 serving = ${(selectedItem as FoodItem)?.servingSize} ${unitLabel}`;


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Add to Meal' : `Add ${selectedItem?.name}`}</DialogTitle>
          {step === 2 && selectedItem && (
            <DialogDescription>
                {servingInfo}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {step === 1 && (
            <div className="py-4">
            <Input
                placeholder="Search for a food or meal..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-4"
            />
            <Tabs defaultValue="foods">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="foods">Foods</TabsTrigger>
                <TabsTrigger value="meals">My Meals</TabsTrigger>
                </TabsList>
                <ScrollArea className="h-72 mt-4">
                <TabsContent value="foods">
                    <div className="space-y-2 pr-4">
                    {filteredFoods.map(food => (
                        <div key={food.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div>
                            <p className="font-semibold">{food.name}</p>
                            <p className="text-sm text-muted-foreground">{food.servingSize} {food.servingUnit} &bull; {food.calories} kcal</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleSelect(food)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        </div>
                    ))}
                    </div>
                </TabsContent>
                <TabsContent value="meals">
                    <div className="space-y-2 pr-4">
                    {filteredCustomMeals.length > 0 ? filteredCustomMeals.map(meal => (
                        <div key={meal.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div>
                            <p className="font-semibold">{meal.name}</p>
                            <p className="text-sm text-muted-foreground">{meal.items.length} items &bull; {meal.totalCalories.toFixed(0)} kcal</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleSelect(meal)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">You haven&apos;t created any meals yet.</p>
                    )}
                    </div>
                </TabsContent>
                </ScrollArea>
            </Tabs>
            </div>
        )}

        {step === 2 && selectedItem && (
             <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-2">
                         <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                        />
                        <span className="text-muted-foreground">{unitLabel}</span>
                    </div>
                </div>
            </div>
        )}

        <DialogFooter>
            {step === 1 && <Button variant="outline" onClick={resetAndClose}>Cancel</Button>}
            {step === 2 && (
                <>
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={handleConfirmAdd} disabled={!quantity || Number(quantity) <= 0}>Add to Meal</Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
