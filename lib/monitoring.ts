type MonitoringContext = Record<string, unknown>;

let sentryUnavailableLogged = false;

async function captureWithSentry(
  error: unknown,
  scope: string,
  context?: MonitoringContext
): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureException(error, {
      tags: { scope },
      extra: context,
    });
  } catch {
    if (!sentryUnavailableLogged) {
      sentryUnavailableLogged = true;
      console.warn(
        "[monitoring] @sentry/nextjs no está instalado. Se usa fallback por consola."
      );
    }
  }
}

export function reportAsyncError(
  scope: string,
  error: unknown,
  context?: MonitoringContext
): void {
  console.error(`[${scope}] operación async falló`, { error, ...context });
  void captureWithSentry(error, scope, context);
}

