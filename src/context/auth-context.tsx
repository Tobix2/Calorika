
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getIdToken: async () => null,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Use signInWithRedirect for a more robust authentication flow.
      await signInWithRedirect(auth, provider);
      // The user will be redirected to Google, and on return,
      // the onAuthStateChanged listener will handle the result.
    } catch (error) {
      console.error("Error initiating sign in with Google redirect", error);
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken, signInWithGoogle, logout }}>
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
