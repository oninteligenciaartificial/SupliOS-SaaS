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

/**
 * Set user context in Sentry for better error tracking.
 * Call this after authentication to associate errors with users.
 */
export async function setSentryUser(user: {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
}): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.setUser({
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });
  } catch {
    // Sentry not available, ignore
  }
}

/**
 * Clear user context in Sentry (e.g., on logout).
 */
export async function clearSentryUser(): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.setUser(null);
  } catch {
    // Sentry not available, ignore
  }
}

/**
 * Add breadcrumb for better error context tracing.
 */
export async function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.addBreadcrumb({
      category,
      message,
      data,
      level: "info",
    });
  } catch {
    // Sentry not available, ignore
  }
}

/**
 * Capture a custom message (not an error) in Sentry.
 * Useful for tracking important events.
 */
export async function captureSentryMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: MonitoringContext
): Promise<void> {
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } catch {
    // Sentry not available, ignore
  }
}

