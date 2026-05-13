"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inp = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

  const PLAN_NAMES: Record<string, string> = {
    basico: "Básico",
    crecer: "Crecer",
    pro: "Pro",
    empresarial: "Empresarial",
  };

  const selectedPlan = planParam ? PLAN_NAMES[planParam] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/setup` },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
        <div className="glass-panel rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h2 className="text-xl font-display font-bold text-white">Revisa tu correo</h2>
          <p className="text-brand-muted text-sm leading-relaxed">
            Te enviamos un enlace de confirmacion a <span className="text-white font-medium">{email}</span>.
            Haz clic en el enlace para activar tu cuenta y configurar tu tienda.
          </p>
          {selectedPlan && (
            <p className="text-brand-muted text-xs">
              Plan seleccionado: <span className="text-brand-kinetic-orange font-bold">{selectedPlan}</span>
            </p>
          )}
          <Link href="/login" className="block text-brand-kinetic-orange text-sm hover:underline mt-4">
            Ya confirme mi correo → Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-brand-kinetic-orange tracking-widest">
            GestiOS.
          </h1>
          <p className="text-brand-muted mt-2 text-sm">Crea tu cuenta — 7 dias gratis, sin tarjeta</p>
          {selectedPlan && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-medium">
              Plan {selectedPlan} seleccionado
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Correo electronico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inp}
              placeholder="tu@negocio.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Contrasena</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inp}
              placeholder="Minimo 8 caracteres"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </button>
        </form>

        <p className="text-center text-sm text-brand-muted">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-kinetic-orange hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
