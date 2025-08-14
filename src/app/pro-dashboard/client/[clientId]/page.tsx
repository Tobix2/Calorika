
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Dashboard from '@/components/dashboard';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getUserProfileAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const params = useParams();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  
  const [clientName, setClientName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      getUserProfileAction(clientId)
        .then(profile => {
          if (profile) {
            setClientName(profile.displayName);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }
  
  if (!clientId) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <p>No se ha proporcionado un ID de cliente.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                        <Link href="/pro-dashboard">
                            <ArrowLeft />
                        </Link>
                        </Button>
                        <h1 className="text-xl font-bold font-headline text-foreground">
                            Panel de: <span className="text-primary">{clientName || 'Cliente'}</span>
                        </h1>
                    </div>
                </div>
            </div>
       </header>
        <Dashboard userId={clientId} isProfessionalView={true} />
    </div>
  );
}
