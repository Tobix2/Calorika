"use client";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const params = useSearchParams();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Página No Encontrada
      </p>
    </div>
  );
}
