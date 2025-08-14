
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface CreateMealDialogProps {
  onCreateMeal: (meal: Omit<CustomMeal, 'id'>) => void;
  foodDatabase: FoodItem[];
  setFoodDatabase: React.Dispatch<React.SetStateAction<FoodItem[]>>;
  onAddIngredient: (food: Omit<FoodItem, 'id'>) => Promise<FoodItem | null>;
}

export default function CreateMealDialog({ onCreateMeal, foodDatabase, setFoodDatabase, onAddIngredient }: CreateMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [creationMode, setCreationMode] = useState<'ingredients' | 'totals'>('ingredients');

  // Manual totals state
  const [manualCalories, setManualCalories] = useState<number | ''>('');
  const [manualProtein, setManualProtein] = useState<number | ''>('');
  const [manualCarbs, setManualCarbs] = useState<number | ''>('');
  const [manualFats, setManualFats] = useState<number | ''>('');
  const [manualServingSize, setManualServingSize] = useState<number | ''>(100);
  const [manualServingUnit, setManualServingUnit] = useState('g');


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
            ...totalsFromIngredients,
            servingSize: 1, // Serving size is 1 "meal"
            servingUnit: 'comida',
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
            servingUnit: manualServingUnit || 'ración',
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
    setManualServingSize(100);
    setManualServingUnit('g');
  }

  const handleAddIngredientAndAddToMeal = async (newIngredientData: Omit<FoodItem, 'id'>) => {
    const newIngredient = await onAddIngredient(newIngredientData);
    if (newIngredient) {
      addFoodToMeal(newIngredient);
    }
    return newIngredient;
  }

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
            Crear Comida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Comida</DialogTitle>
           <DialogDescription>
             Crea una comida a partir de ingredientes o introduce los totales nutricionales directamente. Se guardará en tu base de datos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow py-4 overflow-y-auto">
            <div className="space-y-4 px-1">
                <div className="space-y-2">
                    <Label htmlFor="meal-name">Nombre de la Comida</Label>
                    <Input
                        id="meal-name"
                        placeholder="Ej: Batido Post-Entreno"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                    />
                </div>

                <Tabs value={creationMode} onValueChange={(value) => setCreationMode(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ingredients">Con Ingredientes</TabsTrigger>
                        <TabsTrigger value="totals">Introducir Totales</TabsTrigger>
                    </TabsList>
                    <TabsContent value="ingredients" className="space-y-4 pt-4">
                      <ScrollArea className="h-96 pr-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Ingredientes</Label>
                                <AddIngredientDialog onAddIngredient={handleAddIngredientAndAddToMeal}>
                                    <Button variant="link" size="sm" className="p-0 h-auto">
                                        Añadir Nuevo
                                    </Button>
                                </AddIngredientDialog>
                            </div>
                            <Input
                                placeholder="Buscar un ingrediente..."
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
                            <Label>Ingredientes Seleccionados</Label>
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
                                    Busca y haz clic en un ingrediente para añadirlo.
                                </div>
                            )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="totals" className="pt-4">
                      <ScrollArea className="h-96 pr-4">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Introduce los valores nutricionales para la ración que definas.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manualServingSize">Tamaño de Ración</Label>
                                    <Input id="manualServingSize" type="number" value={manualServingSize} onChange={(e) => setManualServingSize(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manualServingUnit">Unidad</Label>
                                    <Select value={manualServingUnit} onValueChange={setManualServingUnit}>
                                      <SelectTrigger id="manualServingUnit">
                                        <SelectValue placeholder="Seleccionar unidad" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="g">g (gramos)</SelectItem>
                                        <SelectItem value="ml">ml (mililitros)</SelectItem>
                                        <SelectItem value="unidad">unidad(es)</SelectItem>
                                        <SelectItem value="ración">ración(es)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="calories">Calorías (kcal)</Label>
                                    <Input id="calories" type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="protein">Proteína (g)</Label>
                                    <Input id="protein" type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="carbs">Carbohidratos (g)</Label>
                                    <Input id="carbs" type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fats">Grasas (g)</Label>
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
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleCreateMeal} disabled={!isFormValid}>
                <Plus className="mr-2" />
                Crear Comida ({creationMode === 'ingredients' ? totalsFromIngredients.totalCalories.toFixed(0) : Number(manualCalories || 0).toFixed(0)} kcal)
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
