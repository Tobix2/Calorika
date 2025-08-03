"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Beef, Wheat, Droplets } from 'lucide-react';

interface DailySummaryProps {
  totalCalories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fats: number;
  fatsGoal: number;
}

export default function DailySummary({
  totalCalories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fats,
  fatsGoal
}: DailySummaryProps) {
  const progress = calorieGoal > 0 ? (totalCalories / calorieGoal) * 100 : 0;
  
  const MacroStat = ({ icon, title, value, goal }: { icon: React.ReactNode, title: string, value: number, goal: number }) => (
    <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-1">
            {icon}
            <h4 className="font-semibold">{title}</h4>
        </div>
        <p className="text-xl font-bold">{value.toFixed(0)}<span className="text-sm font-normal text-muted-foreground"> / {goal.toFixed(0)}g</span></p>
    </div>
  )

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Daily Summary</CardTitle>
        <CardDescription>Your nutritional intake for today.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-5 w-5" />
                    <span>Calorie Goal</span>
                </div>
                <p className="text-2xl font-bold text-primary">{totalCalories.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ {calorieGoal.toFixed(0)} kcal</span></p>
            </div>
          <Progress value={progress} className="h-3" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <MacroStat icon={<Beef className="h-5 w-5 text-red-500" />} title="Protein" value={protein} goal={proteinGoal} />
            <MacroStat icon={<Wheat className="h-5 w-5 text-yellow-500" />} title="Carbs" value={carbs} goal={carbsGoal} />
            <MacroStat icon={<Droplets className="h-5 w-5 text-blue-500" />} title="Fats" value={fats} goal={fatsGoal} />
        </div>
      </CardContent>
    </Card>
  );
}
