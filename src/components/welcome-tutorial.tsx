
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Bot, UtensilsCrossed, CheckSquare, BarChart2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from './ui/card';

interface WelcomeTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    icon: <BrainCircuit className="h-12 w-12 text-primary" />,
    title: 'Paso 1: Obtén tu recomendación',
    description: 'Ve a la pestaña "Asesor IA" e introduce tus datos (edad, peso, etc.) y tu objetivo. Nuestra IA calculará un plan de calorías y macronutrientes personalizado para ti.',
  },
  {
    icon: <Bot className="h-12 w-12 text-primary" />,
    title: 'Paso 2: Genera un Plan de Comidas',
    description: 'Una vez que tengas tus objetivos, haz clic en el botón "Generar Plan" en la cabecera. La IA creará un plan de comidas para todo el día utilizando los alimentos de tu base de datos.',
  },
  {
    icon: <UtensilsCrossed className="h-12 w-12 text-primary" />,
    title: 'Paso 3: Añade tus Alimentos',
    description: 'Puedes añadir alimentos a cualquier comida haciendo clic en "Añadir Alimento". También puedes crear tus propias comidas personalizadas desde el botón "Crear Comida".',
  },
  {
    icon: <CheckSquare className="h-12 w-12 text-primary" />,
    title: 'Paso 4: Registra tu Plan',
    description: 'A medida que consumes tus comidas, la aplicación registrará automáticamente las calorías y macronutrientes, comparándolos con tus objetivos en el "Resumen Diario".',
  },
  {
    icon: <BarChart2 className="h-12 w-12 text-primary" />,
    title: 'Paso 5: Sigue tu Progreso',
    description: 'Ve a "Mi Progreso" desde el menú de tu perfil para registrar tu peso semanal y ver tu evolución en un gráfico. ¡Constancia es la clave!',
  },
];


export default function WelcomeTutorial({ open, onOpenChange }: WelcomeTutorialProps) {
  
  const handleClose = () => {
    localStorage.setItem('calorika_tutorial_seen', 'true');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¡Bienvenido/a a Calorika!</DialogTitle>
          <DialogDescription>
            Sigue estos simples pasos para empezar a transformar tu nutrición.
          </DialogDescription>
        </DialogHeader>
        
        <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
                {tutorialSteps.map((step, index) => (
                <CarouselItem key={index}>
                    <div className="p-1">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-square gap-4">
                            {step.icon}
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>

        <DialogFooter>
          <Button onClick={handleClose} className='w-full'>¡Entendido, a empezar!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
