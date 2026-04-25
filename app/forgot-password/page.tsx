"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-brand-kinetic-orange tracking-widest">
            GestiOS.
          </h1>
          <p className="text-brand-muted mt-2">Recuperar contraseña</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-kinetic-orange/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-brand-kinetic-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white font-medium">Revisa tu correo</p>
            <p className="text-brand-muted text-sm">
              Te enviamos un enlace a <span className="text-white">{email}</span> para restablecer tu contraseña.
            </p>
            <Link href="/login" className="inline-block text-sm text-brand-kinetic-orange hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-brand-muted text-sm text-center">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-muted mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="admin@minegocio.com"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            <p className="text-center text-sm text-brand-muted">
              <Link href="/login" className="text-brand-kinetic-orange hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
