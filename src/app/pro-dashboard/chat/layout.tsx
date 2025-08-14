
import ChatSidebar from '@/components/pro-dashboard/chat-sidebar';
import { getClientsAction } from '@/app/actions';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Client } from '@/lib/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

async function getClients(uid: string): Promise<Client[]> {
    const { data, error } = await getClientsAction(uid);
    if (error) {
        console.error("Error fetching clients for chat layout:", error);
        return [];
    }
    return data || [];
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a workaround to get the current user on the server.
  // In a real app, you might handle session management differently.
  const currentUser = await new Promise<any>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Debes iniciar sesión para acceder al chat.</p>
        </div>
    )
  }

  const clients = await getClients(currentUser.uid);

  return (
    <div className="flex h-screen w-full bg-muted/40">
        <Suspense fallback={<div>Cargando...</div>}>
            <ChatSidebar clients={clients} />
        </Suspense>
      <main className="flex flex-col flex-1">
        {children}
      </main>
    </div>
  );
}
