"use client";

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getRecommendationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';
import { Lightbulb, Loader2, Sparkles, Beef, Wheat, Droplets } from 'lucide-react';

interface CalorieRecommendationFormProps {
  onGoalSet: (output: CalorieRecommendationOutput) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Calculando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Obtener Recomendación
        </>
      )}
    </Button>
  );
}

const initialState = {
  data: null,
  error: null,
};

export default function CalorieRecommendationForm({ onGoalSet }: CalorieRecommendationFormProps) {
  const [state, formAction] = useActionState(getRecommendationAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  const handleApplyGoal = () => {
    if (state.data) {
        onGoalSet(state.data);
        toast({
            title: "¡Objetivo Actualizado!",
            description: `Tus objetivos diarios han sido actualizados.`,
        });
    }
  }

  return (
    <Card className="shadow-md">
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Asesor de Calorías IA</CardTitle>
          <CardDescription>Obtén una recomendación personalizada de calorías y macros de nuestra IA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" name="age" type="number" defaultValue="25" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" name="weight" type="number" defaultValue="70" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input id="height" name="height" type="number" defaultValue="175" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Nivel de Actividad</Label>
            <Select name="activityLevel" defaultValue="lightlyActive">
              <SelectTrigger id="activityLevel">
                <SelectValue placeholder="Selecciona tu nivel de actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentario (poco o nada de ejercicio)</SelectItem>
                <SelectItem value="lightlyActive">Poco Activo (ejercicio ligero 1-3 días/sem)</SelectItem>
                <SelectItem value="moderatelyActive">Moderadamente Activo (ejercicio moderado 3-5 días/sem)</SelectItem>
                <SelectItem value="veryActive">Muy Activo (ejercicio intenso 6-7 días/sem)</SelectItem>
                <SelectItem value="extraActive">Extra Activo (ejercicio muy intenso/trabajo físico)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <Select name="goal" defaultValue="maintainWeight">
              <SelectTrigger id="goal">
                <SelectValue placeholder="Selecciona tu objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loseWeight">Perder Peso</SelectItem>
                <SelectItem value="maintainWeight">Mantener Peso</SelectItem>
                <SelectItem value="gainMuscle">Ganar Músculo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state.data && (
        <CardContent className="border-t pt-6 space-y-4">
            <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4 rounded-r-md space-y-4">
                <div className="flex">
                    <div className="py-1">
                        <Lightbulb className="h-6 w-6 text-primary mr-4" />
                    </div>
                    <div>
                        <p className="font-bold text-primary">Recomendado: {state.data.recommendedCalories.toFixed(0)} kcal/día</p>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="text-center">
                                <Beef className="h-5 w-5 mx-auto text-red-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedProtein.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Proteína</p>
                            </div>
                            <div className="text-center">
                                <Wheat className="h-5 w-5 mx-auto text-yellow-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedCarbs.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                            <div className="text-center">
                                <Droplets className="h-5 w-5 mx-auto text-blue-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedFats.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Grasas</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <p className="text-sm text-foreground/80">{state.data.explanation}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleApplyGoal}>Aplicar como Objetivo</Button>
        </CardContent>
      )}
    </Card>
  );
}
