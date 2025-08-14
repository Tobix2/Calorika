
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getClientsAction, createSubscriptionAction } from '@/app/actions';
import type { Client } from '@/lib/types';
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

type ViewMode = 'list' | 'grid';

export default function ProDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, startSubscribingTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // State for the "Add Client" dialog
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const FREE_SLOTS = 2;


  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      getClientsAction(user.uid)
        .then((result) => {
          if (result.error) {
            toast({
              variant: 'destructive',
              title: 'Error al cargar clientes',
              description: result.error,
            });
          } else {
            setClients(result.data || []);
          }
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
        // No client email is needed here anymore, we are just buying a "slot"
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
                            Panel de Clientes ({activeClients})
                        </h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                        <div className='flex flex-col text-sm text-muted-foreground'>
                            <InviteLink professionalId={user?.uid || ''} />
                            <span>(Para tus primeros {FREE_SLOTS} clientes gratis)</span>
                        </div>

                         <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Comprar Cupo de Cliente
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Comprar Nuevo Cupo de Cliente</DialogTitle>
                                    <DialogDescription>
                                        Esto iniciará una suscripción de $5.000/mes para un nuevo cupo de cliente. Una vez completado el pago, podrás invitar a un cliente más.
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

                         <div className="flex items-center gap-1 rounded-md bg-background p-1 border">
                           <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === 'grid' && 'bg-muted')} onClick={() => setViewMode('grid')}>
                                <LayoutGrid className="h-4 w-4"/>
                           </Button>
                           <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === 'list' && 'bg-muted')} onClick={() => setViewMode('list')}>
                                <List className="h-4 w-4"/>
                           </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'list' ? <ClientList clients={clients} /> : <ClientGrid clients={clients} />}
            </main>
        </div>
    </AuthGuard>
  );
}
