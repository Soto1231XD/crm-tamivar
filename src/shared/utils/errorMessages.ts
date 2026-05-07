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
    lowered === "error en el servidor. inténtalo más tarde." ||
    lowered === "error en el servidor. intentalo mas tarde."
  ) {
    return fallback;
  }

  if (
    lowered.includes("network error") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("error de conexión con el servidor")
  ) {
    return "No pudimos comunicarnos con el servidor. Verifica tu conexión e inténtalo nuevamente.";
  }

  if (lowered.includes("sesión expirada") || lowered.includes("sesion expirada")) {
    return "Tu sesión ya expiró. Vuelve a iniciar sesión para continuar.";
  }

  if (lowered.includes("no autorizado")) {
    return "Tu sesión no es válida o no tienes autorización para realizar esta acción.";
  }

  if (lowered.includes("no tienes permisos")) {
    return "No cuentas con permisos para realizar esta acción.";
  }

  if (lowered.includes("datos de solicitud inválidos") || lowered.includes("datos de solicitud invalidos")) {
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
