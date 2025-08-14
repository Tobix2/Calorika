
"use client";

import type { Client } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';
import { LayoutDashboard, LineChart, MessageSquare, UserCircle } from 'lucide-react';

interface ClientGridProps {
  clients: Client[];
}

export default function ClientGrid({ clients }: ClientGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {clients.length > 0 ? (
        clients.map((client) => (
          <Card key={client.email} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
               <Avatar className="h-12 w-12">
                  <AvatarImage src={client.photoURL || undefined} />
                  <AvatarFallback>{client.displayName?.[0] || client.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold truncate">{client.displayName || 'N/A'}</h3>
                    <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
               <div>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className={client.status === 'active' ? 'bg-green-500' : ''}>
                    {client.status === 'active' ? 'Activo' : 'Invitado'}
                  </Badge>
               </div>
               <p className="text-xs text-muted-foreground">
                    Invitado: {client.invitationDate ? format(new Date(client.invitationDate), 'dd MMM yyyy', { locale: es }) : 'N/A'}
               </p>
            </CardContent>
            <CardFooter>
                 {client.status === 'active' ? (
                   <div className="flex items-center justify-center gap-2 w-full">
                     <Button variant="outline" size="icon" disabled>
                       <LayoutDashboard className="h-4 w-4" />
                       <span className="sr-only">Ver Dashboard</span>
                     </Button>
                     <Button variant="outline" size="icon" disabled>
                       <LineChart className="h-4 w-4" />
                       <span className="sr-only">Ver Peso</span>
                     </Button>
                     <Button variant="outline" size="icon" disabled>
                       <MessageSquare className="h-4 w-4" />
                       <span className="sr-only">Chatear</span>
                     </Button>
                   </div>
                 ) : (
                  <span className="text-xs text-muted-foreground w-full text-center">Pendiente de registro</span>
                 )}
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center h-48 flex flex-col justify-center items-center bg-card rounded-lg border border-dashed">
            <UserCircle className="h-12 w-12 text-muted-foreground"/>
            <p className="mt-4 font-medium text-muted-foreground">Aún no has invitado a ningún cliente.</p>
            <p className="text-sm text-muted-foreground">Comparte tu enlace de invitación para empezar.</p>
        </div>
      )}
    </div>
  );
}
