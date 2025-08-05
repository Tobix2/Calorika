
'use server';

/**
 * @fileOverview An AI agent that recommends a daily calorie and macronutrient intake based on user data and fitness goals.
 *
 * - getCalorieRecommendation - A function that handles the calorie and macro recommendation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalorieRecommendationInputSchema = z.object({
  age: z.number().describe('La edad del usuario.'),
  weight: z.number().describe('El peso del usuario en kilogramos.'),
  height: z.number().describe('La altura del usuario en centímetros.'),
  gender: z.enum(['male', 'female']).describe('El género del usuario.'),
  activityLevel: z
    .enum(['sedentary', 'lightlyActive', 'moderatelyActive', 'veryActive', 'extraActive'])
    .describe('El nivel de actividad del usuario.'),
  goal: z.enum(['loseWeight', 'maintainWeight', 'gainMuscle']).describe('El objetivo de fitness del usuario.'),
});
export type CalorieRecommendationInput = z.infer<typeof CalorieRecommendationInputSchema>;

const ExplanationSchema = z.object({
  basalMetabolicRate: z.object({
    description: z.string(),
    formula: z.string(),
    calculation: z.string(),
    value: z.number(),
  }),
  totalDailyEnergyExpenditure: z.object({
    description: z.string(),
    formula: z.string(),
    calculation: z.string(),
    value: z.number(),
  }),
  calorieGoal: z.object({
    description: z.string(),
    formula: z.string(),
    calculation: z.string(),
    value: z.number(),
  }),
  macronutrientDistribution: z.object({
    protein: z.object({ description: z.string(), calculation: z.string(), value: z.number() }),
    fats: z.object({ description: z.string(), calculation: z.string(), value: z.number() }),
    carbs: z.object({ description: z.string(), calculation: z.string(), value: z.number() }),
  }),
  summary: z.string(),
  practicalTips: z.array(z.string()),
});

const CalorieRecommendationOutputSchema = z.object({
  recommendedCalories: z.number().describe('La ingesta diaria de calorías recomendada.'),
  recommendedProtein: z.number().describe('La ingesta diaria de proteínas recomendada en gramos.'),
  recommendedCarbs: z.number().describe('La ingesta diaria de carbohidratos recomendada en gramos.'),
  recommendedFats: z.number().describe('La ingesta diaria de grasas recomendada en gramos.'),
  explanation: ExplanationSchema.describe('Un objeto JSON que contiene una explicación detallada y estructurada de cómo se calcularon las recomendaciones de calorías y macronutrientes.'),
});
export type CalorieRecommendationOutput = z.infer<typeof CalorieRecommendationOutputSchema>;

export async function getCalorieRecommendation(input: CalorieRecommendationInput): Promise<CalorieRecommendationOutput> {
  return calorieRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calorieRecommendationPrompt',
  input: {schema: CalorieRecommendationInputSchema},
  output: {schema: CalorieRecommendationOutputSchema},
  prompt: `Eres un entrenador personal experto y nutricionista. Tu tarea es recomendar una ingesta diaria de calorías y macronutrientes basada en los datos personales y objetivos de fitness del usuario. La respuesta final DEBE estar completamente en español.

  Calcula la ingesta diaria de calorías recomendada y el desglose de macronutrientes (proteínas, carbohidratos, grasas) en gramos basándote en la siguiente información:
  Edad: {{{age}}}
  Peso: {{{weight}}} kg
  Altura: {{{height}}} cm
  Género: {{{gender}}}
  Nivel de Actividad: {{{activityLevel}}}
  Objetivo: {{{goal}}}

  Sigue estos pasos para tus cálculos:
  1.  **Tasa Metabólica Basal (TMB):** Usa la ecuación de Mifflin-St Jeor.
      *   Para hombres: (10 x peso en kg) + (6.25 x altura en cm) - (5 x edad) + 5
      *   Para mujeres: (10 x peso en kg) + (6.25 x altura en cm) - (5 x edad) - 161
  2.  **Gasto Energético Diario Total (GET):** Multiplica la TMB por el factor de actividad (sedentario: 1.2, poco activo: 1.375, moderadamente activo: 1.55, muy activo: 1.725, extra activo: 1.9).
  3.  **Ajuste por Objetivo:**
      *   'loseWeight': Resta 500 calorías del GET.
      *   'maintainWeight': Usa el GET como está.
      *   'gainMuscle': Añade 300-500 calorías al GET. Usa 400 como valor por defecto.
  4.  **Distribución de Macronutrientes (¡REGLAS ESTRICTAS E INMUTABLES!):**
      *   Usa el total de calorías ajustado por el objetivo como base para los siguientes cálculos.
      *   **Paso 4.1: Proteína (Calcular primero):** El objetivo es 1.6-2.2 g por kg de peso corporal. Para 'loseWeight', usa un valor moderado y sostenible de **1.8 g/kg**. Para 'gainMuscle', usa **2.0 g/kg**. Calcula los gramos totales de proteína y luego conviértelos a calorías (1g Proteína = 4 kcal).
      *   **Paso 4.2: Grasas (Calcular segundo):** Este macronutriente es esencial. DEBE constituir exactamente el **25% de las calorías totales** del día para asegurar una correcta función hormonal. Calcula las calorías de las grasas (25% del total) y luego conviértelas a gramos (1g Grasa = 9 kcal).
      *   **Paso 4.3: Carbohidratos (Calcular al final):** Las calorías restantes DEBEN ser asignadas a los carbohidratos. La fórmula es: Calorías de Carbs = Total de Calorías - Calorías de Proteína - Calorías de Grasa. Luego convierte esas calorías a gramos (1g Carbs = 4 kcal).
      *   **Verificación Final:** Asegúrate de que la suma de las calorías de Proteína + Grasas + Carbs sea igual al total de calorías recomendado. Si hay una pequeña diferencia por redondeo, ajústala en los gramos de carbohidratos.

  Proporciona una explicación detallada y estructurada en español rellenando el objeto JSON 'explanation'. Cada campo debe ser claro y conciso. La suma de los macros debe ser consistente con las calorías totales recomendadas. Proporciona al menos 4 consejos prácticos en español.

  Devuelve el resultado final en el formato JSON especificado por el esquema de salida. Todo el texto de salida debe estar en español.
  `,
});

const calorieRecommendationFlow = ai.defineFlow(
  {
    name: 'calorieRecommendationFlow',
    inputSchema: CalorieRecommendationInputSchema,
    outputSchema: CalorieRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
