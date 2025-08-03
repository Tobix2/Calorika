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

interface AddFoodDialogProps {
  customMeals: CustomMeal[];
  foodDatabase: FoodItem[];
  onAddFood: (food: FoodItem, quantity: number) => void;
  onAddCustomMeal: (meal: CustomMeal, servings: number) => void;
  children: React.ReactNode;
}

export default function AddFoodDialog({ onAddFood, onAddCustomMeal, customMeals, foodDatabase, children }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);
  const [selectedItem, setSelectedItem] = useState<FoodItem | CustomMeal | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);

  const filteredFoods = foodDatabase.filter(food =>
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
            onAddCustomMeal(selectedItem as CustomMeal, Number(quantity));
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
  const servingInfo = isCustomMeal ? `1 serving = ${(selectedItem as CustomMeal)?.totalCalories.toFixed(0)} kcal` : `${(selectedItem as FoodItem)?.servingSize} ${unitLabel} = ${(selectedItem as FoodItem)?.calories} kcal`;


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
