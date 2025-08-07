
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
    const { signInWithEmail, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signInWithEmail(email, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                </Button>
            </CardFooter>
        </form>
    )
}

function RegisterForm() {
    const { signUpWithEmail, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signUpWithEmail(email, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="reg-email">Correo Electrónico</Label>
                    <Input id="reg-email" type="email" placeholder="tu@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reg-password">Contraseña</Label>
                    <Input id="reg-password" type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                     {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                </Button>
            </CardFooter>
        </form>
    )
}


export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  const handleSignIn = () => {
    signInWithGoogle().catch(err => {
        console.error("❌ Sign in failed:", err);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Leaf className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold font-headline text-foreground">
                Bienvenido a NutriTrack
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Tu asistente de nutrición con IA.
            </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Inicia Sesión</CardTitle>
                        <CardDescription>Accede a tu cuenta para continuar.</CardDescription>
                    </CardHeader>
                    <LoginForm />
                </Card>
            </TabsContent>
            <TabsContent value="register">
                <Card>
                    <CardHeader>
                        <CardTitle>Crea una Cuenta</CardTitle>
                        <CardDescription>Es rápido y fácil. Comienza tu viaje hacia una mejor nutrición.</CardDescription>
                    </CardHeader>
                   <RegisterForm />
                </Card>
            </TabsContent>
        </Tabs>
        
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                O continúa con
                </span>
            </div>
        </div>

        <Button onClick={handleSignIn} variant="outline" size="lg" className="w-full" disabled={loading}>
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.4 0-9.82-4.42-9.82-9.82s4.42-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l-2.4 2.42c-.87-.83-2-1.4-3.92-1.4-3.27 0-5.93 2.66-5.93 5.93s2.66 5.93 5.93 5.93c2.25 0 3.45-1.02 3.96-1.5-.45-.34-.87-.75-1.1-1.13z"></path></svg>
            Google
        </Button>

      </div>
    </div>
  );
}
