
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getClientsAction, createSubscriptionAction, getUserProfileAction } from '@/app/actions';
import type { Client, UserProfile } from '@/lib/types';
import { Loader2, Users, List, LayoutGrid, PlusCircle } from 'lucide-react';
import Header from '@/components/pro-dashboard/header';
import ClientList from '@/components/pro-dashboard/client-list';
import ClientGrid from '@/components/pro-dashboard/client-grid';
import InviteLink from '@/components/pro-dashboard/invite-link';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ViewMode = 'list' | 'grid';

export default function ProDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, startSubscribingTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const FREE_SLOTS = 2;
  const paidSlots = profile?.paidClientSlots || 0;
  const totalSlots = FREE_SLOTS + paidSlots;

  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      Promise.all([
        getClientsAction(user.uid),
        getUserProfileAction(user.uid)
      ]).then(([clientsResult, profileResult]) => {
          if (clientsResult.error) {
            toast({
              variant: 'destructive',
              title: 'Error al cargar clientes',
              description: clientsResult.error,
            });
          } else {
            setClients(clientsResult.data || []);
          }
          setProfile(profileResult);
        })
        .catch(err => {
            toast({
              variant: 'destructive',
              title: 'Error Inesperado',
              description: 'No se pudieron cargar los datos del panel.',
            });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, toast]);
  
  const handleAddClientSlot = () => {
    if (!user || !user.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para realizar esta acción.' });
        return;
    }
    
    startSubscribingTransition(async () => {
        const { checkoutUrl, error } = await createSubscriptionAction(
            user.uid,
            user.email!,
            'professional_client'
        );

        if (error || !checkoutUrl) {
            toast({
                variant: 'destructive',
                title: 'Error al comprar cupo',
                description: error || 'No se pudo generar el enlace de pago.'
            });
        } else {
            window.location.href = checkoutUrl;
        }
        setIsAddClientDialogOpen(false);
    });
  }


  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
        <div className="flex flex-col min-h-screen bg-muted/40">
            <Header />
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
                            Panel de Clientes
                        </h1>
                    </div>
                     <div className="flex items-center gap-1 rounded-md bg-background p-1 border self-end">
                       <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === 'grid' && 'bg-muted')} onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-4 w-4"/>
                       </Button>
                       <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === 'list' && 'bg-muted')} onClick={() => setViewMode('list')}>
                            <List className="h-4 w-4"/>
                       </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="lg:col-span-2">
                         <CardHeader>
                            <CardTitle>Enlace de Invitación</CardTitle>
                            <CardDescription>Comparte este enlace único con tus clientes para que se unan a tu panel.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             <InviteLink professionalId={user?.uid || ''} />
                         </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Cupos de Clientes</CardTitle>
                            <CardDescription>Gestiona tus cupos de clientes disponibles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="text-center">
                             <p className="text-4xl font-bold">{activeClientsCount}/{totalSlots}</p>
                             <p className="text-sm text-muted-foreground">Cupos Utilizados</p>
                           </div>
                           <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Comprar Cupo Adicional
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Comprar Nuevo Cupo de Cliente</DialogTitle>
                                        <DialogDescription>
                                           Esto iniciará una suscripción de $5.000/mes para un nuevo cupo de cliente. Una vez que el pago se complete con éxito, tu límite de clientes aumentará en uno y podrás invitar a un cliente más a través de tu enlace.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleAddClientSlot} disabled={isSubscribing}>
                                            {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Pagar y Activar Cupo
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>

                {viewMode === 'list' ? <ClientList clients={clients} /> : <ClientGrid clients={clients} />}
            </main>
        </div>
    </AuthGuard>
  );
}
