export function getReadableErrorMessage(
  error: unknown,
  fallback = "Ocurrió un problema al procesar la solicitud.",
): string {
  if (error instanceof Error) {
    return normalizeErrorMessage(error.message, fallback);
  }

  if (typeof error === "string") {
    return normalizeErrorMessage(error, fallback);
  }

  return fallback;
}

export function normalizeErrorMessage(
  message: string | undefined | null,
  fallback = "Ocurrió un problema al procesar la solicitud.",
): string {
  const trimmed = String(message ?? "").trim();

  if (!trimmed) {
    return fallback;
  }

  const lowered = trimmed.toLowerCase();

  if (
    lowered === "internal server error" ||
    lowered === "error en el servidor. inténtalo mas tarde." ||
    lowered === "error en el servidor. inténtalo mas tarde."
  ) {
    return fallback;
  }

  if (
    lowered.includes("network error") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("error de conexión con el servidor") ||
    lowered.includes("timeout") ||
    lowered.includes("timed out") ||
    lowered.includes("tardo demasiado")
  ) {
    return "No pudimos comunicarnos con el servidor. Verifica tu conexión e inténtalo nuevamente.";
  }

  if (lowered.includes("sesión expirada")) {
    return "Tu sesión ya expiro. Vuelve a iniciar sesión para continuar.";
  }

  if (lowered.includes("no autorizado")) {
    return "Tu sesión no es valida o no tienes autorización para realizar esta acción.";
  }

  if (lowered.includes("no tienes permisos")) {
    return "No cuentas con permisos para realizar esta acción.";
  }

  if (
    lowered.includes("datos de solicitud inválidos") ||
    lowered.includes("datos inválidos en el formulario")
  ) {
    return "Hay datos inválidos en el formulario. Revisa los campos marcados e inténtalo de nuevo.";
  }

  if (
    lowered.includes("validation failed") ||
    lowered.includes("must be") ||
    lowered.includes("debe ser") ||
    lowered.includes("debe tener") ||
    lowered.includes("required") ||
    lowered.includes("requerido")
  ) {
    return trimmed;
  }

  if (
    lowered.includes("violates") ||
    lowered.includes("viola la restricción") ||
    lowered.includes("null constraint") ||
    lowered.includes("foreign key") ||
    lowered.includes("constraint")
  ) {
    return trimmed;
  }

  if (
    lowered.includes("duplicado") ||
    lowered.includes("ya existe") ||
    lowered.includes("duplicate")
  ) {
    return trimmed;
  }

  if (
    lowered.includes("imagen") ||
    lowered.includes("archivo") ||
    lowered.includes("webp") ||
    lowered.includes("jpg") ||
    lowered.includes("png")
  ) {
    return trimmed;
  }

  return trimmed;
}
