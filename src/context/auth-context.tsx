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
    let redirectHandled = false;
    console.log("AuthProvider: useEffect - start");

    getRedirectResult(auth)
      .then((result) => {
        console.log("AuthProvider: getRedirectResult", result);
        if (result?.user) {
          setUser(result.user);
          router.push("/");
          redirectHandled = true;
        }
      })
      .catch((error) => {
        console.error("AuthProvider: getRedirectResult error", error);
      })
      .finally(() => {
        console.log("AuthProvider: getRedirectResult finally");
        if (!redirectHandled) {
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthProvider: onAuthStateChanged user", user);
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log("AuthProvider: unsubscribing");
      unsubscribe();
    };
  }, [router]);

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error initiating sign in with Google redirect", error);
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
