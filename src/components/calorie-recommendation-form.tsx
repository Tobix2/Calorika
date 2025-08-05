
"use client";

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { getRecommendationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CalorieRecommendationOutput } from '@/ai/flows/calorie-recommendation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sparkles, Loader2, Target, CheckCircle2, Beef, Wheat, Droplets, Dumbbell, Weight, BrainCircuit } from 'lucide-react';

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

  const [age, setAge] = useState<number | string>(40);
  const [gender, setGender] = useState('female');
  const [weight, setWeight] = useState<number | string>(96);
  const [height, setHeight] = useState<number | string>(166);
  const [activityLevel, setActivityLevel] = useState('moderatelyActive');
  const [goal, setGoal] = useState('loseWeight');

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
              <Input id="age" name="age" type="number" value={age} onChange={e => setAge(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select name="gender" value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Selecciona género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" name="weight" type="number" value={weight} onChange={e => setWeight(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" name="height" type="number" value={height} onChange={e => setHeight(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Nivel de Actividad</Label>
            <Select name="activityLevel" value={activityLevel} onValueChange={setActivityLevel}>
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
            <Select name="goal" value={goal} onValueChange={setGoal}>
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
        <CardContent className="border-t pt-6 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Tu Objetivo Diario Recomendado</h3>
             <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                <Target className="h-8 w-8" />
                <span>{state.data.recommendedCalories.toFixed(0)} kcal</span>
            </div>
          </div>
          
           <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 p-3 rounded-lg">
                    <Beef className="h-6 w-6 mx-auto text-red-500 mb-1" />
                    <p className="text-lg font-semibold text-foreground">{state.data.recommendedProtein.toFixed(0)}g</p>
                    <p className="text-xs text-muted-foreground">Proteína</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                    <Wheat className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
                    <p className="text-lg font-semibold text-foreground">{state.data.recommendedCarbs.toFixed(0)}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                    <Droplets className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-semibold text-foreground">{state.data.recommendedFats.toFixed(0)}g</p>
                    <p className="text-xs text-muted-foreground">Grasas</p>
                </div>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="explanation">
                <AccordionTrigger>¿Cómo llegamos a esta recomendación?</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">{state.data.explanation.summary}</p>
                     <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <BrainCircuit className="h-5 w-5 mt-1 text-primary flex-shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Tasa Metabólica Basal (TMB)</h4>
                                <p className="text-xs text-muted-foreground">{state.data.explanation.basalMetabolicRate.description}</p>
                                <p className="text-xs font-mono bg-muted p-1 rounded mt-1">{state.data.explanation.basalMetabolicRate.calculation} = {state.data.explanation.basalMetabolicRate.value.toFixed(0)} kcal</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Dumbbell className="h-5 w-5 mt-1 text-primary flex-shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Gasto Energético Diario Total (GET)</h4>
                                <p className="text-xs text-muted-foreground">{state.data.explanation.totalDailyEnergyExpenditure.description}</p>
                                 <p className="text-xs font-mono bg-muted p-1 rounded mt-1">{state.data.explanation.totalDailyEnergyExpenditure.calculation} = {state.data.explanation.totalDailyEnergyExpenditure.value.toFixed(0)} kcal</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Weight className="h-5 w-5 mt-1 text-primary flex-shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Objetivo Calórico Final</h4>
                                <p className="text-xs text-muted-foreground">{state.data.explanation.calorieGoal.description}</p>
                                 <p className="text-xs font-mono bg-muted p-1 rounded mt-1">{state.data.explanation.calorieGoal.calculation} = {state.data.explanation.calorieGoal.value.toFixed(0)} kcal</p>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tips">
                <AccordionTrigger>Consejos Prácticos</AccordionTrigger>
                <AccordionContent className="pt-2">
                    <ul className="space-y-2">
                        {state.data.explanation.practicalTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button variant="outline" className="w-full" onClick={handleApplyGoal}>Aplicar como Objetivo</Button>
        </CardContent>
      )}
    </Card>
  );
}
