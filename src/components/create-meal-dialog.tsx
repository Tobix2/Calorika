
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FoodItem, CustomMeal } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check, UtensilsCrossed } from 'lucide-react';

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

interface CreateMealDialogProps {
  onCreateMeal: (meal: CustomMeal) => void;
}

export default function CreateMealDialog({ onCreateMeal }: CreateMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);

  const filteredFoods = MOCK_FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFoodSelection = (food: FoodItem) => {
    setSelectedFoods(prev =>
      prev.find(item => item.id === food.id)
        ? prev.filter(item => item.id !== food.id)
        : [...prev, food]
    );
  };

  const handleCreateMeal = () => {
    if (mealName.trim() && selectedFoods.length > 0) {
      const totals = selectedFoods.reduce(
        (acc, item) => ({
          totalCalories: acc.totalCalories + item.calories,
          totalProtein: acc.totalProtein + item.protein,
          totalCarbs: acc.totalCarbs + item.carbs,
          totalFats: acc.totalFats + item.fats,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
      );

      const newMeal: CustomMeal = {
        id: crypto.randomUUID(),
        name: mealName,
        items: selectedFoods.map(food => ({...food, id: crypto.randomUUID()})), // Give new IDs to items in meal
        ...totals,
      };
      onCreateMeal(newMeal);
      setOpen(false);
      setMealName('');
      setSelectedFoods([]);
      setSearchTerm('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <UtensilsCrossed className="mr-2"/>
            Create a Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Meal</DialogTitle>
          <DialogDescription>
            Combine foods into a custom meal for quick logging.
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
            <div className="space-y-2">
                <Label>Ingredients</Label>
                <Input
                    placeholder="Search for an ingredient..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-2"
                />
                <ScrollArea className="h-48 rounded-md border">
                    <div className="p-2 space-y-1">
                    {filteredFoods.map(food => {
                        const isSelected = selectedFoods.some(item => item.id === food.id);
                        return (
                            <div
                                key={food.id}
                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                                    isSelected ? 'bg-primary/20' : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleFoodSelection(food)}
                            >
                                <div>
                                    <p className="font-semibold">{food.name}</p>
                                    <p className="text-sm text-muted-foreground">{food.calories} kcal</p>
                                </div>
                                {isSelected && <Check className="h-5 w-5 text-primary" />}
                            </div>
                        );
                    })}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateMeal} disabled={!mealName.trim() || selectedFoods.length === 0}>
            <Plus className="mr-2" />
            Create Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
