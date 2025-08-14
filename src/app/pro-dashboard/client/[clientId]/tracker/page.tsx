
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyWeightEntry } from '@/lib/types';
import { getWeightHistoryAction, getUserProfileAction } from '@/app/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Loader2, WeightIcon, History } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ClientTrackerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;

  const [clientName, setClientName] = useState<string | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeeklyWeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && clientId) {
      setIsLoading(true);
      Promise.all([
        getWeightHistoryAction(clientId),
        getUserProfileAction(clientId)
      ]).then(([history, profile]) => {
          setWeightHistory(history);
          setClientName(profile?.displayName || 'Cliente');
      }).catch(error => {
          toast({
            variant: 'destructive',
            title: 'Error al cargar datos',
            description: 'No se pudo obtener el historial de peso del cliente.',
          });
      }).finally(() => setIsLoading(false));
    }
  }, [user, clientId, toast]);

  const formattedData = useMemo(() => 
    weightHistory.map((entry, index) => ({
      ...entry,
      weekNumber: index + 1,
      formattedDate: format(new Date(entry.date), 'd MMM yyyy', { locale: es }),
    })), [weightHistory]);
  
  const reversedHistoryWithWeek = useMemo(() => {
    const totalEntries = weightHistory.length;
    return [...weightHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((entry, index) => ({
        ...entry,
        weekNumber: totalEntries - index,
      }));
  }, [weightHistory]);

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/pro-dashboard">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <WeightIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-xl md:text-2xl font-bold font-headline text-foreground">
                      Progreso de: <span className="text-primary">{clientName || 'Cargando...'}</span>
                    </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
             <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="shadow-md lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Progreso de Peso Corporal</CardTitle>
                            <CardDescription>Evolución del peso semanal del cliente a lo largo del tiempo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {weightHistory.length > 1 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={formattedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="formattedDate" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80} 
                                    tickFormatter={(tick, index) => `Semana ${index + 1}`} 
                                />
                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                                <Tooltip 
                                    labelFormatter={(label, payload) => `Semana ${payload?.[0]?.payload.weekNumber}: ${label}`}
                                    formatter={(value) => [`${value} kg`, 'Peso']}
                                />
                                <Legend formatter={() => "Peso (kg)"}/>
                                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-center">
                                <WeightIcon className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">No hay suficientes datos</h3>
                                <p className="text-muted-foreground">Se necesitan al menos dos registros para ver el gráfico.</p>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5"/>
                            Historial de Registros
                        </CardTitle>
                        <CardDescription>Registros de peso semanales del cliente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[28.5rem]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>Semana</TableHead>
                                        <TableHead className="text-right">Peso (kg)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reversedHistoryWithWeek.length > 0 ? (
                                            reversedHistoryWithWeek.map(entry => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="font-medium">
                                                        <div className='flex flex-col'>
                                                        <span>Semana {entry.weekNumber}</span>
                                                        <span className='text-xs text-muted-foreground'>{format(new Date(entry.date), 'dd MMM yyyy', { locale: es })}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{entry.weight.toFixed(1)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground h-40">
                                                    El cliente no tiene registros de peso.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
