
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getIdToken: async () => null,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => null,
  signInWithEmail: async () => null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect
    } catch (error) {
      console.error("Error signing in with Google", error);
       toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "No se pudo iniciar sesión con Google.",
      });
    } finally {
        setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle the redirect
        return userCredential.user;
    } catch (error: any) {
        console.error("Error signing up:", error);
        toast({
            variant: "destructive",
            title: "Error al Registrarse",
            description: error.code === 'auth/email-already-in-use' 
                ? 'Este correo electrónico ya está en uso.' 
                : 'Ocurrió un error. Inténtalo de nuevo.',
        });
        return null;
    } finally {
        setLoading(false);
    }
  };
    
  const signInWithEmail = async (email: string, pass: string) => {
      setLoading(true);
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          // onAuthStateChanged will handle the redirect
          return userCredential.user;
      } catch (error: any) {
          console.error("Error signing in:", error);
          toast({
              variant: "destructive",
              title: "Error al Iniciar Sesión",
              description: "Las credenciales son incorrectas. Por favor, verifica tu correo y contraseña.",
          });
          return null;
      } finally {
          setLoading(false);
      }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, getIdToken, signInWithGoogle, signUpWithEmail, signInWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
