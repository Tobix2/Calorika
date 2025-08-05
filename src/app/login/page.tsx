
"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSignIn = () => {
    signInWithGoogle().catch(err => {
        console.error("Sign in failed", err);
    });
  };

  // While loading or if user exists, show a loading state or nothing to avoid flashes
  if (loading || user) {
      return (
          <div className="flex min-h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Leaf className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold font-headline text-foreground">
                Welcome to NutriTrack
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Your AI-powered nutrition partner.
            </p>
            <div className="mt-8">
                 <Button onClick={handleSignIn} size="lg" className="w-full">
                    {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        // Replace with a proper Google icon if available or just text
                         "Sign In with Google"
                    )}
                </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
                By signing in, you agree to our terms of service.
            </p>
        </div>
    </div>
  );
}
