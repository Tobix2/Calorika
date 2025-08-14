
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background">
      <div className="text-center">
        <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">Selecciona un chat</h2>
        <p className="mt-2 text-muted-foreground">
          Elige un cliente de la lista para ver la conversación o empezar a chatear.
        </p>
      </div>
    </div>
  );
}
