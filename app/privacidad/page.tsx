import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — GestiOS",
  description: "Política de privacidad de GestiOS, operado por ONIA.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="text-xl font-display font-bold tracking-widest text-[#FF6B00]">GestiOS.</div>
        <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Volver al inicio
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Política de Privacidad</h1>
          <p className="text-white/40 text-sm">Última actualización: 15 de mayo de 2026</p>
        </div>

        <div className="space-y-10 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Datos que recopilamos</h2>
            <p className="mb-3">
              GestiOS (operado por ONIA) recopila los siguientes datos para prestar el servicio:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong className="text-white/90">Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña al momento del registro.</li>
              <li><strong className="text-white/90">Datos de negocio:</strong> nombre de la empresa, tipo de negocio, productos, clientes, ventas y demás información que el usuario ingresa voluntariamente al usar la plataforma.</li>
              <li><strong className="text-white/90">Datos de uso:</strong> páginas visitadas dentro de la aplicación, acciones realizadas y tiempos de sesión, con el fin de mejorar la experiencia.</li>
              <li><strong className="text-white/90">Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y dispositivo, necesarios para la seguridad y el funcionamiento del servicio.</li>
              <li><strong className="text-white/90">Datos de pago:</strong> no almacenamos datos de tarjetas. Los pagos se procesan mediante transferencia bancaria o QR. Solo guardamos el registro de la transacción confirmada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Cómo usamos los datos</h2>
            <p className="mb-3">Usamos tus datos exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Proveer, mantener y mejorar el servicio de GestiOS.</li>
              <li>Enviar notificaciones transaccionales (confirmaciones, alertas de inventario, vencimientos) configuradas por el usuario.</li>
              <li>Enviar comunicaciones de soporte cuando el usuario lo solicita.</li>
              <li>Detectar y prevenir fraudes o usos no autorizados.</li>
              <li>Cumplir con obligaciones legales aplicables en Bolivia.</li>
            </ul>
            <p className="mt-3">No vendemos ni cedemos tus datos personales a terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Cookies</h2>
            <p className="mb-3">
              GestiOS utiliza cookies y tecnologías similares para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong className="text-white/90">Cookies de sesión:</strong> necesarias para mantener la sesión activa durante el uso de la aplicación. Se eliminan al cerrar el navegador.</li>
              <li><strong className="text-white/90">Cookies de preferencia:</strong> recuerdan ajustes como el tipo de negocio o idioma seleccionado.</li>
              <li><strong className="text-white/90">Cookies de análisis:</strong> recopilamos métricas de uso agregadas para mejorar el servicio. No identifican a usuarios individuales.</li>
            </ul>
            <p className="mt-3">
              Podés desactivar las cookies desde la configuración de tu navegador. Ten en cuenta que algunas funcionalidades del sistema pueden verse afectadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Terceros</h2>
            <p className="mb-3">Para operar el servicio, trabajamos con los siguientes proveedores de confianza:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong className="text-white/90">Supabase:</strong> base de datos y autenticación. Tus datos se almacenan en servidores seguros con cifrado en reposo.</li>
              <li><strong className="text-white/90">Vercel:</strong> infraestructura de despliegue de la aplicación.</li>
              <li><strong className="text-white/90">Brevo (Sendinblue):</strong> envío de correos electrónicos transaccionales.</li>
              <li><strong className="text-white/90">Sentry:</strong> monitoreo de errores técnicos. No recopila datos de negocio.</li>
            </ul>
            <p className="mt-3">
              Estos proveedores están contractualmente obligados a proteger tus datos y no pueden utilizarlos para fines propios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS/TLS), cifrado en reposo, autenticación segura mediante Supabase Auth, Row Level Security (RLS) en la base de datos para que cada organización acceda únicamente a sus propios datos, y monitoreo continuo de accesos.
            </p>
            <p className="mt-3">
              Ante cualquier incidente de seguridad que pueda afectar tus datos, te notificaremos dentro de las 72 horas de haber tomado conocimiento del hecho.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Tus derechos</h2>
            <p className="mb-3">Como usuario de GestiOS, tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong className="text-white/90">Acceso:</strong> solicitar una copia de los datos que tenemos sobre vos.</li>
              <li><strong className="text-white/90">Rectificación:</strong> corregir datos incorrectos o desactualizados.</li>
              <li><strong className="text-white/90">Eliminación:</strong> solicitar la eliminación de tu cuenta y datos asociados.</li>
              <li><strong className="text-white/90">Portabilidad:</strong> exportar tus datos de negocio en formato CSV.</li>
              <li><strong className="text-white/90">Oposición:</strong> oponerte al procesamiento de tus datos para fines de análisis.</li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, contactanos en{" "}
              <a href="mailto:soporte@gestios.bo" className="text-[#FF6B00] hover:underline">soporte@gestios.bo</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Al cancelar tu suscripción, tus datos se mantienen durante 30 días para permitirte exportarlos. Pasado ese plazo, se eliminan de forma permanente, salvo obligación legal que exija conservarlos por mayor tiempo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Contacto</h2>
            <p>
              Para consultas, reclamos o solicitudes relacionadas con esta política, contactanos:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70">
              <p><strong className="text-white">GestiOS</strong> — operado por ONIA</p>
              <p>Bolivia</p>
              <p>
                Email:{" "}
                <a href="mailto:soporte@gestios.bo" className="text-[#FF6B00] hover:underline">
                  soporte@gestios.bo
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
          <Link href="/terminos" className="text-sm text-[#FF6B00] hover:underline">
            Ver Términos y Condiciones →
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        GestiOS · Sistema de gestion para negocios en Bolivia y Latinoamerica
      </footer>
    </div>
  );
}
