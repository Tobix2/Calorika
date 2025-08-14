
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Client } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getClientsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


export default function ChatSidebar() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeClientId = params.clientId;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
        getClientsAction(user.uid)
            .then(result => {
                if (result.data) {
                    setClients(result.data);
                } else if (result.error) {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                }
            })
            .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  const filteredClients = clients.filter(client =>
    client.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hidden md:flex flex-col w-80 border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/pro-dashboard">
                    <ArrowLeft className="h-4 w-4"/>
                </Link>
            </Button>
            <h2 className="text-xl font-bold">Chats</h2>
        </div>
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4"
        />
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
            <div className="flex justify-center items-center h-full p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <nav className="p-2 space-y-1">
            {filteredClients.map(client => (
                <Link
                key={client.id}
                href={`/pro-dashboard/chat/${client.id}`}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                    activeClientId === client.id && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                >
                <Avatar className="h-8 w-8">
                    <AvatarImage src={client.photoURL || undefined} />
                    <AvatarFallback>{client.displayName?.[0] || 'C'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                    <p className="font-semibold truncate">{client.displayName}</p>
                    <p className={cn("text-xs truncate", activeClientId === client.id && 'text-primary-foreground/80')}>
                        {client.email}
                    </p>
                </div>
                </Link>
            ))}
            </nav>
        )}
      </ScrollArea>
    </div>
  );
}
