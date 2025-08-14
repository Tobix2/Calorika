
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { sendMessageAction, getUserProfileAction, getProfessionalForClientAction } from '@/app/actions';
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function ClientChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [professional, setProfessional] = useState<UserProfile | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getProfessionalForClientAction(user.uid).then(result => {
        if (result.professionalId) {
          setProfessionalId(result.professionalId);
          getUserProfileAction(result.professionalId).then(setProfessional);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
          setIsLoading(false);
        }
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user || !professionalId) return;

    const chatRoomId = [user.uid, professionalId].sort().join('_');
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
  }, [user, professionalId, toast]);
  
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
    if (!newMessage.trim() || !user || !professionalId) return;

    const chatRoomId = [user.uid, professionalId].sort().join('_');
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
        setNewMessage(textToSend); // Restore message on failure
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <h1 className="text-xl md:text-2xl font-bold font-headline text-foreground">
                    Chat con: <span className="text-primary">{professional?.displayName || 'Mi Profesional'}</span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col container mx-auto p-4 sm:p-6 lg:p-8 overflow-hidden">
          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !professionalId ? (
             <div className="flex-grow flex items-center justify-center text-center">
                <p className="text-muted-foreground">No estás asociado a ningún profesional.</p>
            </div>
          ) : (
            <>
             <ScrollArea className="flex-grow -mx-4" ref={scrollAreaRef}>
                <div className="px-4 py-2 space-y-4">
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
                            <AvatarImage src={''} alt={professional?.displayName || 'P'} />
                            <AvatarFallback>{professional?.displayName?.charAt(0) || 'P'}</AvatarFallback>
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
                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Y'} />
                            <AvatarFallback>{user?.displayName?.charAt(0) || 'Y'}</AvatarFallback>
                          </Avatar>
                       )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t pt-4 mt-4">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Enviar</span>
                </Button>
              </form>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
