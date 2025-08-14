"use client";

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getClientsAction, addClientAction } from '@/app/actions';
import type { Client } from '@/lib/types';
import { Loader2, Users } from 'lucide-react';
import Header from '@/components/pro-dashboard/header';
import AddClientDialog from '@/components/pro-dashboard/add-client-dialog';
import ClientList from '@/components/pro-dashboard/client-list';
import InviteLink from '@/components/pro-dashboard/invite-link';
import AuthGuard from '@/components/auth-guard';

export default function ProDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingClient, startAddingClientTransition] = useTransition();

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

  const handleAddClient = async (clientEmail: string) => {
    if (!user?.uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
        return;
    }

    startAddingClientTransition(async () => {
        const result = await addClientAction(user.uid, clientEmail);
        if (result.error || !result.data) {
            toast({
                variant: 'destructive',
                title: 'Error al añadir cliente',
                description: result.error || 'No se pudo añadir al cliente.',
            });
        } else {
            setClients((prev) => [...prev, result.data!]);
            toast({
                title: '¡Cliente invitado!',
                description: `${clientEmail} ha sido invitado y añadido a tu lista.`,
            });
        }
    });
  };

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
                            Panel de Clientes ({clients.length})
                        </h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                        <InviteLink professionalId={user?.uid || ''} />
                         <AddClientDialog onAddClient={handleAddClient} isAdding={isAddingClient} />
                    </div>
                </div>

                <ClientList clients={clients} />
            </main>
        </div>
    </AuthGuard>
  );
}
