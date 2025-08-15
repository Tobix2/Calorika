import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";
import { Loader2 } from "lucide-react";

export default function NotFoundPage() {
  // Envolvemos el componente que usa useSearchParams en Suspense.
  // Esto permite que el resto de la página se renderice en el servidor si es necesario,
  // mientras que la parte dinámica espera al cliente.
  return (
    <Suspense fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    }>
      <NotFoundClient />
    </Suspense>
  );
}
