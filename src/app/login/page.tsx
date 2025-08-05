
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();

  const handleSignIn = () => {
    console.log("🟡 Sign in button clicked");
    signInWithGoogle()
      .then(() => {
        console.log("🟢 Sign in successful (redirect initiated)");
      })
      .catch(err => {
        console.error("❌ Sign in failed:", err);
      });
  };

  // AuthGuard se encarga de la redirección, por lo que podemos simplificar esta página.
  // Mostramos un loader general si la librería de autenticación todavía está determinando el estado.
  if (loading) {
      return (
          <div className="flex min-h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  // Si el usuario ya está logueado, AuthGuard lo redirigirá.
  // Si no, mostramos la página de login.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Leaf className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold font-headline text-foreground">
                Bienvenido a NutriTrack
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Tu asistente de nutrición con IA.
            </p>
            <div className="mt-8">
                 <Button onClick={handleSignIn} size="lg" className="w-full">
                    {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                         "Iniciar Sesión con Google"
                    )}
                </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
                Al iniciar sesión, aceptas nuestros términos de servicio.
            </p>
        </div>
    </div>
  );
}
