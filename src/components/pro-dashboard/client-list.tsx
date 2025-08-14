
"use client";

import type { Client } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';
import { LayoutDashboard, LineChart, MessageSquare } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
}

export default function ClientList({ clients }: ClientListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Invitación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={client.photoURL || undefined} />
                          <AvatarFallback>{client.displayName?.[0] || client.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.displayName || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className={client.status === 'active' ? 'bg-green-500' : ''}>
                        {client.status === 'active' ? 'Activo' : 'Invitado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {client.invitationDate ? format(new Date(client.invitationDate), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.status === 'active' ? (
                         <div className="flex items-center justify-end gap-2">
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
                        <span className="text-xs text-muted-foreground">Pendiente</span>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Aún no has invitado a ningún cliente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
