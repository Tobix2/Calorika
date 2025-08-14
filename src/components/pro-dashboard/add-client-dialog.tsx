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
          Invitar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Introduce el correo electrónico del cliente para invitarlo a tu panel. Recibirá un email para aceptar y registrarse.
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
            Enviar Invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
