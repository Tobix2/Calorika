
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Dashboard from '@/components/dashboard';
import { Loader2 } from 'lucide-react';
import { getUserProfileAction } from '@/app/actions';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha terminado y no hay usuario, redirige a login.
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    // Si hay usuario, verificamos su rol
    if (!loading && user) {
        getUserProfileAction(user.uid).then(profile => {
            // Si el usuario es un profesional, redirigir a su dashboard
            if (profile?.role === 'profesional') {
                router.push('/pro-dashboard');
            }
        });
    }

  }, [user, loading, router]);

  // Muestra el spinner mientras se carga el estado de autenticación
  // o si el objeto de usuario aún no está disponible.
  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }

  // Una vez que el usuario está verificado y disponible, muestra el Dashboard.
  return <Dashboard />;
}
