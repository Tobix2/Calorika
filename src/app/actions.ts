'use server';

import {
  getCalorieRecommendation,
  type CalorieRecommendationInput,
  type CalorieRecommendationOutput,
} from '@/ai/flows/calorie-recommendation';

export async function getRecommendationAction(
  prevState: any,
  formData: FormData
): Promise<{ data: CalorieRecommendationOutput | null; error: string | null }> {
  const rawFormData = {
    age: Number(formData.get('age')),
    weight: Number(formData.get('weight')),
    height: Number(formData.get('height')),
    activityLevel: formData.get('activityLevel'),
    goal: formData.get('goal'),
  };

  try {
    const result = await getCalorieRecommendation(rawFormData as CalorieRecommendationInput);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { data: null, error: `Failed to get recommendation: ${errorMessage}` };
  }
}
