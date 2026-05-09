"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground">Ha ocurrido un error inesperado.</p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
