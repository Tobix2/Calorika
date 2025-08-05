
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2, LogIn } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // No need to await, as it will redirect
      signInWithGoogle();
    } catch (error) {
      console.error("Failed to initiate sign in with Google", error);
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);


  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold font-headline text-foreground">NutriTrack</h1>
            </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full" size="lg" disabled={isSigningIn}>
            {isSigningIn ? (
                <>
                    <Loader2 className="mr-2 animate-spin" />
                    Redirecting...
                </>
            ) : (
                <>
                    <LogIn className="mr-2" />
                    Sign In with Google
                </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
