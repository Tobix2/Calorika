
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import type { FoodItem, CustomMeal, MealItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

interface AddFoodDialogProps {
  customMeals: CustomMeal[];
  foodDatabase: FoodItem[];
  onAddFood: (food: FoodItem, quantity: number) => void;
  onAddCustomMeal: (meal: CustomMeal, servings: number) => void;
  onDeleteItem: (item: FoodItem | CustomMeal) => void;
  children: React.ReactNode;
}

type DialogStep = 'search' | 'quantity' | 'details';

export default function AddFoodDialog({ onAddFood, onAddCustomMeal, customMeals, foodDatabase, children, onDeleteItem }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<DialogStep>('search');
  const [selectedItem, setSelectedItem] = useState<FoodItem | CustomMeal | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);

  // State for the delete confirmation dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | CustomMeal | null>(null);

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomMeals = customMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetAndClose = () => {
    setOpen(false);
    setSearchTerm('');
    setStep('search');
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleSelect = (item: FoodItem | CustomMeal) => {
    setSelectedItem(item);
    if ('items' in item && item.items.length > 0) { // It's a CustomMeal with ingredients
      setStep('details');
    } else { // It's a regular FoodItem or a CustomMeal without detailed items
      setQuantity(item.servingSize);
      setStep('quantity');
    }
  };
  
  const handleConfirmAdd = () => {
    if (selectedItem) {
        if ('items' in selectedItem) { // CustomMeal
            onAddCustomMeal(selectedItem as CustomMeal, Number(quantity));
        } else { // FoodItem
            onAddFood(selectedItem as FoodItem, Number(quantity));
        }
        resetAndClose();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: FoodItem | CustomMeal) => {
    e.stopPropagation();
    setItemToDelete(item);
    setIsAlertOpen(true);
  }

  const confirmDelete = () => {
    if (itemToDelete) {
        onDeleteItem(itemToDelete);
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetAndClose();
    }
    setOpen(isOpen);
  }

  const isCustomMeal = selectedItem && 'totalCalories' in selectedItem;
  const unitLabel = selectedItem?.servingUnit;
  const servingInfo = isCustomMeal 
    ? `${(selectedItem as CustomMeal)?.servingSize} ${unitLabel} = ${(selectedItem as CustomMeal)?.totalCalories.toFixed(0)} kcal`
    : `${(selectedItem as FoodItem)?.servingSize} ${unitLabel} = ${(selectedItem as FoodItem)?.calories} kcal`;


  const renderTitle = () => {
    switch (step) {
      case 'search': return 'Añadir a Comida';
      case 'quantity': return `Añadir ${selectedItem?.name}`;
      case 'details': return `Detalles de ${selectedItem?.name}`;
      default: return 'Añadir';
    }
  };
  
  const renderDescription = () => {
     switch (step) {
      case 'search': return 'Busca un alimento o comida para añadir a tu plan.';
      case 'quantity': return servingInfo;
      case 'details': return `Ingredientes para 1 ${selectedItem?.servingUnit || 'ración'}. Total: ${isCustomMeal ? (selectedItem as CustomMeal).totalCalories.toFixed(0) : ''} kcal`;
      default: return '';
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{renderTitle()}</DialogTitle>
            <DialogDescription>{renderDescription()}</DialogDescription>
          </DialogHeader>
          
          {step === 'search' && (
              <div className="py-4">
              <Input
                  placeholder="Buscar un alimento o comida..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="mb-4"
              />
              <Tabs defaultValue="foods">
                  <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="foods">Alimentos</TabsTrigger>
                  <TabsTrigger value="meals">Mis Comidas</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-72 mt-4">
                  <TabsContent value="foods">
                      <div className="space-y-2 pr-4">
                      {filteredFoods.map(food => (
                          <div key={food.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted group">
                          <div onClick={() => handleSelect(food)} className="flex-grow cursor-pointer">
                              <p className="font-semibold">{food.name}</p>
                              <p className="text-sm text-muted-foreground">{food.servingSize} {food.servingUnit} &bull; {food.calories} kcal</p>
                          </div>
                           <div className="flex items-center">
                              <Button size="icon" variant="ghost" onClick={() => handleSelect(food)}>
                                  <Plus className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteClick(e, food)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                          </div>
                      ))}
                      </div>
                  </TabsContent>
                  <TabsContent value="meals">
                      <div className="space-y-2 pr-4">
                      {filteredCustomMeals.length > 0 ? filteredCustomMeals.map(meal => (
                          <div key={meal.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted group">
                          <div onClick={() => handleSelect(meal)} className="flex-grow cursor-pointer">
                              <p className="font-semibold">{meal.name}</p>
                              <p className="text-sm text-muted-foreground">{meal.servingSize} {meal.servingUnit} &bull; {meal.totalCalories.toFixed(0)} kcal</p>
                          </div>
                           <div className="flex items-center">
                              <Button size="icon" variant="ghost" onClick={() => handleSelect(meal)}>
                                  <Plus className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteClick(e, meal)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                          </div>
                      )) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Aún no has creado ninguna comida.</p>
                      )}
                      </div>
                  </TabsContent>
                  </ScrollArea>
              </Tabs>
              </div>
          )}

          {step === 'quantity' && selectedItem && (
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad</Label>
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

          {step === 'details' && selectedItem && 'items' in selectedItem && (
            <div className="py-4">
              <ScrollArea className="h-60 rounded-md border p-2">
                <div className="space-y-2">
                  {selectedItem.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.quantity} {item.servingUnit}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}


          <DialogFooter>
              {step === 'search' && <Button variant="outline" onClick={resetAndClose}>Cancelar</Button>}
              {(step === 'quantity' || step === 'details') && (
                  <>
                      <Button variant="outline" onClick={() => setStep('search')}>Atrás</Button>
                      <Button onClick={step === 'details' ? () => setStep('quantity') : handleConfirmAdd} disabled={step === 'quantity' && (!quantity || Number(quantity) <= 0)}>
                          {step === 'details' ? 'Añadir a Comida' : 'Confirmar'}
                      </Button>
                  </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente "{itemToDelete?.name}" de tu base de datos.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    