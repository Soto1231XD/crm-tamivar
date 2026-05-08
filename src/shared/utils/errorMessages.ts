export function getReadableErrorMessage(
  error: unknown,
  fallback = "Ocurrio un problema al procesar la solicitud.",
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
  fallback = "Ocurrio un problema al procesar la solicitud.",
): string {
  const trimmed = String(message ?? "").trim();

  if (!trimmed) {
    return fallback;
  }

  const lowered = trimmed.toLowerCase();

  if (
    lowered === "internal server error" ||
    lowered === "error en el servidor. intentalo mas tarde." ||
    lowered === "error en el servidor. intentalo mas tarde."
  ) {
    return fallback;
  }

  if (
    lowered.includes("network error") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("error de conexion con el servidor") ||
    lowered.includes("timeout") ||
    lowered.includes("timed out") ||
    lowered.includes("tardo demasiado")
  ) {
    return "No pudimos comunicarnos con el servidor. Verifica tu conexion e intentalo nuevamente.";
  }

  if (lowered.includes("sesion expirada")) {
    return "Tu sesion ya expiro. Vuelve a iniciar sesion para continuar.";
  }

  if (lowered.includes("no autorizado")) {
    return "Tu sesion no es valida o no tienes autorizacion para realizar esta accion.";
  }

  if (lowered.includes("no tienes permisos")) {
    return "No cuentas con permisos para realizar esta accion.";
  }

  if (
    lowered.includes("datos de solicitud invalidos") ||
    lowered.includes("datos invalidos en el formulario")
  ) {
    return "Hay datos invalidos en el formulario. Revisa los campos marcados e intentalo de nuevo.";
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
    lowered.includes("viola la restriccion") ||
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
