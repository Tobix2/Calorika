
"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionAction, saveUserProfileAction, acceptInvitationAction, getUserProfileAction, checkClientSlotAction } from "@/app/actions";
import { Loader2 } from "lucide-react";
import type { UserRole, UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSubscribing: boolean;
  getIdToken: () => Promise<string | null>;
  signInWithGoogle: (paymentIntent: string | null, role: UserRole, proId?: string | null) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole, paymentIntent?: string | null, proId?: string | null) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string, paymentIntent?: string | null) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSubscribing: false,
  getIdToken: async () => null,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => null,
  signInWithEmail: async () => null,
  logout: async () => {},
  updateUserProfile: async () => {},
});

function AuthOverlay() {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">Procesando suscripción...</p>
        </div>
    );
}


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, startSubscribingTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSuccessfulAuth = async (user: User, role: UserRole, paymentIntent: string | null, proId: string | null) => {
        try {
            const profileData: Partial<UserProfile> = {
                displayName: user.displayName || '',
                role: role,
            };
            await saveUserProfileAction(user.uid, profileData);
        } catch (error) {
            console.error("Failed to save user profile", error);
        }

        if (proId) {
            try {
                const result = await acceptInvitationAction(proId, {
                    uid: user.uid,
                    email: user.email!,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });
                 if (!result.success) {
                     toast({ variant: "destructive", title: "Error de Invitación", description: result.error || "No se pudo completar la asociación con tu profesional." });
                 }
            } catch (error) {
                 console.error("🔥 Falló al llamar a acceptInvitationAction:", error);
                 toast({ variant: "destructive", title: "Error Crítico de Invitación", description: "No se pudo procesar tu invitación." });
            }
        }

        const destination = role === 'profesional' ? '/pro-dashboard' : '/dashboard';

        if ((paymentIntent?.startsWith('premium')) && user.email) {
            startSubscribingTransition(async () => {
                const { checkoutUrl, error } = await createSubscriptionAction(user.uid, user.email!, paymentIntent!);
                if (error || !checkoutUrl) {
                    toast({ variant: 'destructive', title: 'Error de Suscripción', description: error || 'No se pudo crear el enlace de pago.' });
                    router.push(destination);
                } else {
                    window.location.href = checkoutUrl;
                }
            });
        } else {
            router.push(destination);
        }
    };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const signInWithGoogle = async (paymentIntent: string | null = null, role: UserRole = 'cliente', proId: string | null = null) => {
    setLoading(true);
    try {
        if (proId) {
            const slotCheck = await checkClientSlotAction(proId);
            if (!slotCheck.available) {
                toast({ variant: "destructive", title: "Límite de Clientes Alcanzado", description: slotCheck.error });
                setLoading(false);
                return;
            }
        }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const profile = await getUserProfileAction(result.user.uid);
      const finalRole = profile?.role || role;

      await handleSuccessfulAuth(result.user, finalRole, paymentIntent, proId);
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
          setLoading(false);
          return;
        };
        console.error("Error signing in with Google", error);
        toast({ variant: "destructive", title: "Error de Autenticación", description: "No se pudo iniciar sesión con Google." });
    } finally {
        if (!isSubscribing) setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole, paymentIntent: string | null = null, proId: string | null = null) => {
    setLoading(true);
    try {
        if (proId) {
            const slotCheck = await checkClientSlotAction(proId);
            if (!slotCheck.available) {
                toast({ variant: "destructive", title: "Límite de Clientes Alcanzado", description: slotCheck.error });
                setLoading(false);
                return null;
            }
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        setUser({ ...userCredential.user, displayName: name });
        await handleSuccessfulAuth(userCredential.user, role, paymentIntent, proId);
        return userCredential.user;
    } catch (error: any) {
        console.error("Error signing up:", error);
        toast({ variant: "destructive", title: "Error al Registrarse", description: error.code === 'auth/email-already-in-use' ? 'Este correo electrónico ya está en uso.' : 'Ocurrió un error. Inténtalo de nuevo.' });
        return null;
    } finally {
         if (!isSubscribing) setLoading(false);
    }
  };
    
  const signInWithEmail = async (email: string, pass: string, paymentIntent: string | null = null) => {
      setLoading(true);
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          const profile = await getUserProfileAction(userCredential.user.uid);
          const finalRole = profile?.role || 'cliente'; // Default to 'cliente' if no role found
          await handleSuccessfulAuth(userCredential.user, finalRole, paymentIntent, null);
          return userCredential.user;
      } catch (error: any) {
          console.error("Error signing in:", error);
          toast({ variant: "destructive", title: "Error al Iniciar Sesión", description: "Las credenciales son incorrectas. Por favor, verifica tu correo y contraseña." });
          return null;
      } finally {
          if (!isSubscribing) setLoading(false);
      }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, profile);
        setUser({ ...auth.currentUser }); 
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }
    } else {
      throw new Error("No user is currently signed in.");
    }
  };


  return (
    <AuthContext.Provider
      value={{ user, loading, isSubscribing, getIdToken, signInWithGoogle, signUpWithEmail, signInWithEmail, logout, updateUserProfile }}
    >
      {isSubscribing && <AuthOverlay />}
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
