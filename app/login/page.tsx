"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all disabled:opacity-50"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);

  // When the server action succeeds, the auth cookies are already set
  // by Supabase SSR via the server cookieStore. A hard navigation
  // ensures the dashboard layout reads the fresh cookies on the next
  // request (router.push/refresh can race the cookie propagation).
  useEffect(() => {
    if (state?.ok) {
      window.location.href = "/";
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-brand-kinetic-orange tracking-widest">
            GestiOS.
          </h1>
          <p className="text-brand-muted mt-2">Inicia sesion para continuar</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-muted mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="admin@minegocio.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-brand-muted">
                Contrasena
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-kinetic-orange hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state && !state.ok && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}

          {state?.ok && (
            <p className="text-green-400 text-sm">Sesión iniciada. Redirigiendo…</p>
          )}

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-brand-muted">
          No tienes cuenta?{" "}
          <Link href="/signup" className="text-brand-kinetic-orange hover:underline">
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
