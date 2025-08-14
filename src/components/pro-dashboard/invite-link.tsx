"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';

interface InviteLinkProps {
  professionalId: string;
}

export default function InviteLink({ professionalId }: InviteLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/register?pro_id=${professionalId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast({ title: '¡Enlace copiado!', description: 'Puedes compartir este enlace con tus clientes.' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background p-2">
      <input
        type="text"
        value={inviteUrl}
        readOnly
        className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none"
      />
      <Button size="icon" variant="ghost" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
