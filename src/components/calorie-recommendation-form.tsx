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
          Calculating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Get Recommendation
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
            title: "Goal Updated!",
            description: `Your daily goals have been updated.`,
        });
    }
  }

  return (
    <Card className="shadow-md">
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">AI Calorie Advisor</CardTitle>
          <CardDescription>Get a personalized calorie & macro recommendation from our AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" defaultValue="25" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" name="weight" type="number" defaultValue="70" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" name="height" type="number" defaultValue="175" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Activity Level</Label>
            <Select name="activityLevel" defaultValue="lightlyActive">
              <SelectTrigger id="activityLevel">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                <SelectItem value="lightlyActive">Lightly Active (light exercise/sports 1-3 days/week)</SelectItem>
                <SelectItem value="moderatelyActive">Moderately Active (moderate exercise/sports 3-5 days/week)</SelectItem>
                <SelectItem value="veryActive">Very Active (hard exercise/sports 6-7 days a week)</SelectItem>
                <SelectItem value="extraActive">Extra Active (very hard exercise/physical job)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Select name="goal" defaultValue="maintainWeight">
              <SelectTrigger id="goal">
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loseWeight">Lose Weight</SelectItem>
                <SelectItem value="maintainWeight">Maintain Weight</SelectItem>
                <SelectItem value="gainMuscle">Gain Muscle</SelectItem>
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
                        <p className="font-bold text-primary">Recommended: {state.data.recommendedCalories.toFixed(0)} kcal/day</p>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="text-center">
                                <Beef className="h-5 w-5 mx-auto text-red-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedProtein.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Protein</p>
                            </div>
                            <div className="text-center">
                                <Wheat className="h-5 w-5 mx-auto text-yellow-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedCarbs.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                            <div className="text-center">
                                <Droplets className="h-5 w-5 mx-auto text-blue-500" />
                                <p className="text-sm font-semibold text-foreground">{state.data.recommendedFats.toFixed(0)}g</p>
                                <p className="text-xs text-muted-foreground">Fats</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <p className="text-sm text-foreground/80">{state.data.explanation}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleApplyGoal}>Apply as Goal</Button>
        </CardContent>
      )}
    </Card>
  );
}
