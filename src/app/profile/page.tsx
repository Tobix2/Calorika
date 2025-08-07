
"use client";

import AuthGuard from '@/components/auth-guard';
import ProfileForm from '@/components/profile-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <User className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold font-headline text-foreground">Mi Perfil</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-xl mx-auto">
            <ProfileForm />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
