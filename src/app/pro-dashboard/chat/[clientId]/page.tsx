
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { sendMessageAction, getUserProfileAction } from '@/app/actions';
import { Loader2, Send } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function ProfessionalChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const { toast } = useToast();

  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientId) {
      setIsLoading(true);
      getUserProfileAction(clientId).then(setClientProfile);
    }
  }, [clientId]);

  useEffect(() => {
    if (!user || !clientId) return;

    const chatRoomId = [user.uid, clientId].sort().join('_');
    const messagesQuery = query(collection(db, 'chats', chatRoomId, 'messages'), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs: ChatMessage[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        });
      });
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
        console.error("Error al escuchar mensajes:", error);
        toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo conectar al chat."})
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clientId, toast]);
  
   useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !clientId) return;

    const chatRoomId = [user.uid, clientId].sort().join('_');
    const textToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    const result = await sendMessageAction(chatRoomId, {
      text: textToSend,
      senderId: user.uid,
    });
    
    setIsSending(false);
    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setNewMessage(textToSend);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-full bg-background">
          <header className="flex items-center gap-4 border-b bg-card p-4">
             <Avatar>
              <AvatarImage src={clientProfile?.displayName || ''} />
              <AvatarFallback>{clientProfile?.displayName?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{clientProfile?.displayName || 'Cliente'}</h2>
          </header>
          
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
             <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        msg.senderId === user?.uid ? 'justify-end' : 'justify-start'
                      )}
                    >
                       {msg.senderId !== user?.uid && (
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={''} alt={clientProfile?.displayName || 'C'} />
                            <AvatarFallback>{clientProfile?.displayName?.charAt(0) || 'C'}</AvatarFallback>
                          </Avatar>
                       )}
                       <div className={cn(
                           'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg',
                           msg.senderId === user?.uid
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted rounded-bl-none'
                       )}>
                           <p className="text-sm">{msg.text}</p>
                       </div>
                        {msg.senderId === user?.uid && (
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'P'} />
                            <AvatarFallback>{user?.displayName?.charAt(0) || 'P'}</AvatarFallback>
                          </Avatar>
                       )}
                    </div>
                  ))}
                </div>
          </ScrollArea>
           <div className="border-t bg-card p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={isSending}
                    autoComplete='off'
                  />
                  <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Enviar</span>
                  </Button>
              </form>
            </div>
      </div>
    </AuthGuard>
  );
}
