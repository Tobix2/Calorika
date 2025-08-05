"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  console.log("LoginPage", { loading, user });

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return <p>Cargando...</p>;

  if (user) return null;

  return (
    <div>
      <button onClick={() => signInWithGoogle()}>Login con Google</button>
    </div>
  );
}
