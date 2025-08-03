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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { FoodItem, CustomMeal } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const MOCK_FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, serving: '1 medium' },
  { id: '2', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, serving: '1 medium' },
  { id: '3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, serving: '100g' },
  { id: '4', name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, serving: '1 cup cooked' },
  { id: '5', name: 'Whole Egg', calories: 78, protein: 6, carbs: 0.6, fats: 5, serving: '1 large' },
  { id: '6', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fats: 49, serving: '100g' },
  { id: '7', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, serving: '100g' },
  { id: '8', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, serving: '100g' },
  { id: '9', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, serving: '1 cup' },
  { id: '10', name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100, serving: '100g' },
  { id: '11', name: 'Oats', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, serving: '100g' },
  { id: '12', name: 'Protein Powder', calories: 393, protein: 80, carbs: 8, fats: 4, serving: '100g' },
];

interface AddFoodDialogProps {
  customMeals: CustomMeal[];
  onAddFood: (food: FoodItem) => void;
  onAddCustomMeal: (meal: CustomMeal) => void;
  children: React.ReactNode;
}

export default function AddFoodDialog({ onAddFood, onAddCustomMeal, customMeals, children }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFoods = MOCK_FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomMeals = customMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFood = (food: FoodItem) => {
    onAddFood({ ...food, id: crypto.randomUUID() });
    setOpen(false);
    setSearchTerm('');
  };

  const handleAddMeal = (meal: CustomMeal) => {
    onAddCustomMeal(meal);
    setOpen(false);
    setSearchTerm('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Meal</DialogTitle>
        </DialogHeader>
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
                        <p className="text-sm text-muted-foreground">{food.serving} &bull; {food.calories} kcal</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleAddFood(food)}>
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
                      <Button size="icon" variant="ghost" onClick={() => handleAddMeal(meal)}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
