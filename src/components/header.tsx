
"use client";

import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Button } from './ui/button';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-foreground">Calorika</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
             <Link href="/#benefits" className="text-sm font-medium text-muted-foreground hover:text-primary">Beneficios</Link>
             <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary">¿Cómo funciona?</Link>
             <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary">Planes</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/login?view=register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
