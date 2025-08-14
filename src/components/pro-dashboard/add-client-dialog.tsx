
"use client";

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';

interface AddClientDialogProps {
  onAddClient: (email: string) => Promise<void>;
  isAdding: boolean;
}

export default function AddClientDialog({ onAddClient, isAdding }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleAdd = async () => {
    if (!email) return;
    await onAddClient(email);
    // Only close if successful, the parent component shows a toast
    setOpen(false);
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Introduce el correo del cliente para añadirlo a tu panel. Luego, comparte tu enlace de invitación para que pueda registrarse.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="email" className="sr-only">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={isAdding || !email}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
