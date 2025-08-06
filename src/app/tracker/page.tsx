
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyWeightEntry } from '@/lib/types';
import { getWeightHistoryAction, addWeightEntryAction } from '@/app/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Loader2, Plus, WeightIcon } from 'lucide-react';
import Link from 'next/link';

export default function TrackerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weightHistory, setWeightHistory] = useState<WeeklyWeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getWeightHistoryAction(user.uid)
        .then(history => {
          setWeightHistory(history);
          if (history.length > 0) {
            // Find the most recent entry to display in the input
            const lastEntry = history.reduce((latest, entry) => 
                new Date(latest.date) > new Date(entry.date) ? latest : entry
            );
            setCurrentWeight(lastEntry.weight.toString());
          }
        })
        .catch(error => {
          toast({
            variant: 'destructive',
            title: 'Error al cargar datos',
            description: 'No se pudo obtener tu historial de peso.',
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, toast]);

  const handleAddWeight = () => {
    if (!user || !currentWeight) return;

    const weightValue = parseFloat(currentWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Por favor, introduce un número de peso válido.',
      });
      return;
    }

    startTransition(async () => {
      const newEntry: Omit<WeeklyWeightEntry, 'id'> = {
        weight: weightValue,
        date: new Date().toISOString(),
      };

      try {
        const { entry, updated } = await addWeightEntryAction(user.uid, newEntry);
        
        if (updated) {
          // If updated, replace the existing entry for that week
          setWeightHistory(prev => prev.map(item => item.id === entry.id ? entry : item));
           toast({
              title: '¡Registro Actualizado!',
              description: `El peso de esta semana se ha actualizado a ${weightValue} kg.`,
            });
        } else {
          // If new, add it to the list
          setWeightHistory(prev => [...prev, entry]);
           toast({
              title: '¡Éxito!',
              description: `Peso de ${weightValue} kg registrado para esta semana.`,
            });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al registrar',
          description: 'No se pudo guardar el nuevo registro de peso.',
        });
      }
    });
  };

  const formattedData = weightHistory.map(entry => ({
    ...entry,
    // Format date for the chart tooltip and axis
    formattedDate: format(new Date(entry.date), 'd MMM yyyy', { locale: es }),
  }));

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <WeightIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold font-headline text-foreground">Seguimiento de Peso</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Progreso de Peso Corporal</CardTitle>
                  <CardDescription>Visualiza la evolución de tu peso semanal a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-80">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                  ) : weightHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" angle={-45} textAnchor="end" height={80} tickFormatter={(tick) => `Semana del ${tick}`} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                            labelFormatter={(label) => `Semana del: ${label}`}
                            formatter={(value) => [`${value} kg`, 'Peso']}
                        />
                        <Legend formatter={() => "Peso (kg)"}/>
                        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 text-center">
                        <WeightIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">No hay suficientes datos</h3>
                        <p className="text-muted-foreground">Necesitas al menos dos registros de peso semanales para ver un gráfico.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Registrar Peso Semanal</CardTitle>
                  <CardDescription>Añade o actualiza tu peso de esta semana. Solo se guarda un registro por semana.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso Actual (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={currentWeight}
                      onChange={e => setCurrentWeight(e.target.value)}
                      placeholder="Ej: 95.5"
                    />
                  </div>
                  <Button onClick={handleAddWeight} disabled={isPending || !currentWeight} className="w-full">
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Guardar Peso
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

    