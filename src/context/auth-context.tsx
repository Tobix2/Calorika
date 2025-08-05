
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  getRedirectResult,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

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
    // This effect runs once on mount to handle auth state.
    
    // First, check if a redirect result is pending.
    getRedirectResult(auth)
      .then((result) => {
        // If we get a result, it means the user just signed in via redirect.
        // onAuthStateChanged will handle setting the user, so we don't need to do it here.
        if (result?.user) {
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("Auth Error: Failed to get redirect result.", error);
      });

    // Then, set up the onAuthStateChanged listener.
    // This is the primary source of truth for the user's auth state.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts.
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
    setLoading(true); // Set loading to true before redirecting
    try {
      await signInWithRedirect(auth, provider);
      // The page will redirect, and the useEffect will handle the result on return.
    } catch (error) {
      console.error("Error initiating sign in with Google redirect", error);
      setLoading(false); // Reset loading state on error
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null, triggering redirect in AuthGuard
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, getIdToken, signInWithGoogle, logout }}
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
