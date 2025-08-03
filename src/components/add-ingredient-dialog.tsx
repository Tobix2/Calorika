
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
import type { FoodItem } from '@/lib/types';
import { addFood } from '@/services/foodService';
import { useToast } from '@/hooks/use-toast';

interface AddIngredientDialogProps {
  onAddIngredient: (food: FoodItem) => void;
  children: React.ReactNode;
}

export default function AddIngredientDialog({ onAddIngredient, children }: AddIngredientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState<number | ''>(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fats, setFats] = useState<number | ''>('');
  const { toast } = useToast();
  
  const resetForm = () => {
    setName('');
    setServingSize(100);
    setServingUnit('g');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  }

  const handleSave = async () => {
    if (name && servingSize !== '' && servingUnit && calories !== '' && protein !== '' && carbs !== '' && fats !== '') {
      const newIngredientData = {
        name,
        servingSize: Number(servingSize),
        servingUnit,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fats: Number(fats),
      };

      try {
        const newIngredient = await addFood(newIngredientData);
        onAddIngredient(newIngredient);
        toast({
            title: "Ingredient Saved!",
            description: `${newIngredient.name} has been added to the database.`,
        });
        resetForm();
        setOpen(false);
      } catch (error) {
          console.error("Failed to save ingredient:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save the new ingredient.",
          });
      }
    }
  };
  
  const isFormValid = name && servingSize !== '' && servingUnit && calories !== '' && protein !== '' && carbs !== '' && fats !== '';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Ingredient</DialogTitle>
          <DialogDescription>
            Enter the nutritional details for the new food item. This will be saved to your database.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="name">Ingredient Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Almond Butter"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="servingSize">Serving Size</Label>
                  <Input id="servingSize" type="number" value={servingSize} onChange={(e) => setServingSize(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g., 100"/>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="servingUnit">Unit</Label>
                  <Input id="servingUnit" value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} placeholder="e.g., g, ml, cup"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="calories">Calories (kcal)</Label>
                    <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input id="protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fats">Fats (g)</Label>
                    <Input id="fats" type="number" value={fats} onChange={(e) => setFats(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isFormValid}>Save Ingredient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
