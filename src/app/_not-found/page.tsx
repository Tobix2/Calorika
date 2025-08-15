// src/app/_not-found/page.tsx
import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NotFoundClient />
    </Suspense>
  );
}
