
"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Si está cargando o no hay usuario, no renderiza nada,
  // ya que la página que lo usa (HomePage) mostrará el spinner principal.
  if (loading || !user) {
    return null;
  }

  // Si el usuario está autenticado, renderiza los componentes hijos.
  return <>{children}</>;
}
