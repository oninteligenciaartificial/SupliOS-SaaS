import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones — GestiOS",
  description: "Términos y condiciones de uso de GestiOS, operado por ONIA.",
};

export default function TerminosPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Términos y Condiciones</h1>
          <p className="text-white/40 text-sm">Última actualización: 15 de mayo de 2026</p>
        </div>

        <div className="space-y-10 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Aceptación de los términos</h2>
            <p>
              Al crear una cuenta o utilizar la plataforma GestiOS (en adelante "el Servicio"), operada por ONIA, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debés usar el Servicio. El uso continuado del Servicio implica la aceptación de cualquier modificación futura a estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Descripción del servicio</h2>
            <p>
              GestiOS es una plataforma SaaS (Software as a Service) de gestión empresarial diseñada para negocios en Bolivia y Latinoamérica. El Servicio incluye, según el plan contratado: punto de venta (POS), gestión de inventario, administración de pedidos, CRM, reportes, facturación electrónica, y herramientas de comunicación con clientes.
            </p>
            <p className="mt-3">
              ONIA se reserva el derecho de modificar, suspender o discontinuar cualquier funcionalidad del Servicio con aviso previo razonable, salvo en casos de urgencia técnica o de seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Registro y cuenta</h2>
            <p className="mb-3">Para utilizar el Servicio, debés:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Ser mayor de 18 años o representar legalmente a la empresa que registrás.</li>
              <li>Proporcionar información verídica y mantenerla actualizada.</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Ser responsable de todas las actividades realizadas desde tu cuenta.</li>
            </ul>
            <p className="mt-3">
              Una cuenta corresponde a una organización. No está permitido compartir credenciales entre distintas empresas o usuarios no autorizados. Para agregar colaboradores, utilizá la función de equipo disponible en el plan correspondiente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Planes y pagos</h2>
            <p className="mb-3">
              GestiOS ofrece un período de prueba gratuito de 7 días sin requerir tarjeta de crédito. Finalizado el período de prueba, debés contratar un plan pago para continuar usando el Servicio.
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong className="text-white/90">Moneda:</strong> todos los precios están expresados en Bolivianos (BOB).</li>
              <li><strong className="text-white/90">Facturación:</strong> mensual o anual según el plan seleccionado. El pago es anticipado.</li>
              <li><strong className="text-white/90">Métodos de pago:</strong> transferencia bancaria (Banco Ganadero), QR bancario, Tigo Money o pagos internacionales según disponibilidad.</li>
              <li><strong className="text-white/90">Cambio de plan:</strong> podés cambiar de plan en cualquier momento. El cambio aplica de inmediato.</li>
              <li><strong className="text-white/90">Reembolsos:</strong> no ofrecemos reembolsos por períodos parciales. En caso de error de cobro, contactanos dentro de los 5 días hábiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Uso aceptable</h2>
            <p className="mb-3">Al usar GestiOS, te comprometés a no:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Utilizar el Servicio para actividades ilegales o fraudulentas.</li>
              <li>Intentar acceder a datos de otras organizaciones.</li>
              <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier parte del software.</li>
              <li>Usar el Servicio para enviar spam, malware o contenido dañino.</li>
              <li>Sobrecargar deliberadamente la infraestructura del Servicio.</li>
              <li>Revender o sublicenciar el acceso al Servicio sin autorización expresa de ONIA.</li>
            </ul>
            <p className="mt-3">
              ONIA se reserva el derecho de suspender o cancelar cuentas que violen estas condiciones, sin previo aviso y sin derecho a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Propiedad intelectual</h2>
            <p>
              El software, diseño, marca, logotipos, textos y demás elementos de GestiOS son propiedad de ONIA y están protegidos por las leyes de propiedad intelectual aplicables. El contrato de uso no te otorga ningún derecho de propiedad sobre el Servicio.
            </p>
            <p className="mt-3">
              Los datos que ingresás al sistema (productos, clientes, ventas, etc.) son de tu propiedad. ONIA no reclama derechos sobre ellos y únicamente los procesa para prestar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Disponibilidad del servicio</h2>
            <p>
              ONIA se esfuerza por mantener el Servicio disponible las 24 horas del día, los 7 días de la semana. Sin embargo, no garantizamos disponibilidad ininterrumpida. Realizamos mantenimientos programados con aviso previo cuando es posible.
            </p>
            <p className="mt-3">
              El objetivo de disponibilidad es del 99% mensual (aproximadamente 7 horas de inactividad al mes). No se aplican créditos automáticos por interrupciones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Limitación de responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley boliviana, ONIA no será responsable por daños indirectos, incidentales, especiales o consecuentes, incluyendo pérdida de datos, pérdida de ingresos o interrupción del negocio, derivados del uso o imposibilidad de uso del Servicio.
            </p>
            <p className="mt-3">
              La responsabilidad total de ONIA hacia vos no excederá el monto pagado por el Servicio en los últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Cancelación</h2>
            <p>
              Podés cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. Al cancelar, tu acceso continuará hasta el final del período pagado. No se realizan reembolsos por el tiempo restante.
            </p>
            <p className="mt-3">
              Tras la cancelación, tus datos se conservan durante 30 días para que puedas exportarlos. Pasado ese plazo, se eliminan permanentemente.
            </p>
            <p className="mt-3">
              ONIA puede cancelar o suspender tu cuenta por violación de estos términos, falta de pago reiterada, o por requerimiento legal, con o sin aviso previo según la gravedad del caso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Modificaciones</h2>
            <p>
              ONIA puede actualizar estos Términos y Condiciones en cualquier momento. Los cambios materiales serán notificados por correo electrónico con al menos 15 días de anticipación. El uso continuado del Servicio después de la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República de Bolivia. Para cualquier disputa derivada del uso del Servicio, las partes se someten a la jurisdicción de los tribunales competentes del Estado Plurinacional de Bolivia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Contacto</h2>
            <p>Para consultas sobre estos términos, contactanos:</p>
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
          <Link href="/privacidad" className="text-sm text-[#FF6B00] hover:underline">
            Ver Política de Privacidad →
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        GestiOS · Sistema de gestion para negocios en Bolivia y Latinoamerica
      </footer>
    </div>
  );
}
