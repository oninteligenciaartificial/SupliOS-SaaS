import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
