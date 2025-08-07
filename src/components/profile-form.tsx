
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { getUserProfileAction, saveUserProfileAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

export default function ProfileForm() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | ''>('');

  useEffect(() => {
    if (user) {
      // Set initial display name from auth context
      setDisplayName(user.displayName || '');

      // Fetch additional profile data like age from Firestore
      getUserProfileAction(user.uid).then(profile => {
        if (profile) {
          setAge(profile.age || '');
        }
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName) return;

    startTransition(async () => {
      try {
        // 1. Update Firebase Auth display name
        await updateUserProfile({ displayName });

        // 2. Prepare profile data for Firestore
        const profileData: UserProfile = {
          displayName,
          age: Number(age) || undefined,
        };

        // 3. Save profile data to Firestore
        await saveUserProfileAction(user.uid, profileData);

        toast({
          title: '¡Perfil Actualizado!',
          description: 'Tu información ha sido guardada correctamente.',
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          variant: 'destructive',
          title: 'Error al actualizar',
          description: 'No se pudo guardar tu información. Inténtalo de nuevo.',
        });
      }
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Actualiza tu nombre y edad. Esta información se utilizará para personalizar tu experiencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={e => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="Tu edad"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
