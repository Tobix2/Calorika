
"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Beef, Wheat, Droplets } from 'lucide-react';
import { Input } from "./ui/input";

interface DailySummaryProps {
  totalCalories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fats: number;
  fatsGoal: number;
  setCalorieGoal: (value: number) => void;
  setProteinGoal: (value: number) => void;
  setCarbsGoal: (value: number) => void;
  setFatsGoal: (value: number) => void;
}

export default function DailySummary({
  totalCalories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fats,
  fatsGoal,
  setCalorieGoal,
  setProteinGoal,
  setCarbsGoal,
  setFatsGoal
}: DailySummaryProps) {
  const progress = calorieGoal > 0 ? (totalCalories / calorieGoal) * 100 : 0;
  
  const handleGoalChange = useCallback((setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    setter(value);
  }, []);

  const MacroStat = ({ icon, title, value, goal, onGoalChange }: { icon: React.ReactNode, title: string, value: number, goal: number, onGoalChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
            {icon}
            <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="text-center">
            <p className="text-xl font-bold">{value.toFixed(0)}g</p>
            <div className="relative mt-1">
                 <Input 
                    type="number"
                    value={goal.toString()}
                    onChange={onGoalChange}
                    className="text-center text-sm font-normal text-muted-foreground bg-transparent pr-7"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">g</span>
            </div>
        </div>
    </div>
  )

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Resumen Diario</CardTitle>
        <CardDescription>Tu ingesta y objetivos nutricionales para hoy. Puedes editar tus objetivos directamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-5 w-5" />
                    <span>Objetivo de Calorías</span>
                </div>
                 <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-primary">{totalCalories.toFixed(0)}</p>
                    <span className="text-sm font-normal text-muted-foreground">/</span>
                    <div className="relative">
                        <Input 
                            type="number" 
                            value={calorieGoal.toString()}
                            onChange={handleGoalChange(setCalorieGoal)}
                            className="w-32 h-9 text-lg text-right font-bold bg-transparent pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-normal text-muted-foreground">kcal</span>
                    </div>
                 </div>
            </div>
          <Progress value={progress} className="h-3" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <MacroStat icon={<Beef className="h-5 w-5 text-red-500" />} title="Proteína" value={protein} goal={proteinGoal} onGoalChange={handleGoalChange(setProteinGoal)} />
            <MacroStat icon={<Wheat className="h-5 w-5 text-yellow-500" />} title="Carbs" value={carbs} goal={carbsGoal} onGoalChange={handleGoalChange(setCarbsGoal)} />
            <MacroStat icon={<Droplets className="h-5 w-5 text-blue-500" />} title="Grasas" value={fats} goal={fatsGoal} onGoalChange={handleGoalChange(setFatsGoal)} />
        </div>
      </CardContent>
    </Card>
  );
}
