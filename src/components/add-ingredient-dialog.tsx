
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

interface AddIngredientDialogProps {
  onAddIngredient: (food: Omit<FoodItem, 'id'>) => Promise<FoodItem | null>;
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
  const [isSaving, setIsSaving] = useState(false);
  
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

      setIsSaving(true);
      const result = await onAddIngredient(newIngredientData);
      setIsSaving(false);

      if (result) {
        resetForm();
        setOpen(false);
      }
    }
  };
  
  const isFormValid = name && servingSize !== '' && servingUnit && calories !== '' && protein !== '' && carbs !== '' && fats !== '';

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetForm();
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Ingrediente</DialogTitle>
          <DialogDescription>
            Introduce los detalles nutricionales del nuevo alimento. Se guardará en tu base de datos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto py-2 pr-2">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Ingrediente</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mantequilla de almendras"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="servingSize">Tamaño de Ración</Label>
                      <Input id="servingSize" type="number" value={servingSize} onChange={(e) => setServingSize(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 100"/>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="servingUnit">Unidad</Label>
                      <Input id="servingUnit" value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} placeholder="Ej: g, ml, taza"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="calories">Calorías (kcal)</Label>
                        <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="protein">Proteína (g)</Label>
                        <Input id="protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="carbs">Carbohidratos (g)</Label>
                        <Input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="fats">Grasas (g)</Label>
                        <Input id="fats" type="number" value={fats} onChange={(e) => setFats(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter className="border-t pt-4 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Ingrediente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
