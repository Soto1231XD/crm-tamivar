type DevelopmentErrorContext =
  | "load_list"
  | "load_detail"
  | "create"
  | "update"
  | "delete";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function getFriendlyDevelopmentError(
  error: unknown,
  context: DevelopmentErrorContext,
) {
  const rawMessage = getErrorMessage(error).trim();
  const message = rawMessage.toLowerCase();

  if (!rawMessage) {
    return getFallbackMessage(context);
  }

  if (message.includes("sesión expirada") || message.includes("no autorizado")) {
    return "Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.";
  }

  if (message.includes("no tienes permisos")) {
    return "No cuentas con permisos para realizar esta acción en desarrollos.";
  }

  if (message.includes("formato de archivo no permitido")) {
    return "Solo se permiten imágenes JPG, PNG o WEBP para el desarrollo y sus modelos.";
  }

  if (
    message.includes("exceden el límite permitido") ||
    message.includes("payload too large")
  ) {
    return "Las imágenes exceden el límite permitido. Revisa el peso por archivo o el peso total del envío.";
  }

  if (message.includes("la fecha de entrega del desarrollo no es valida")) {
    return "La fecha de entrega no es válida. Selecciona únicamente mes y año.";
  }

  if (message.includes("url valida")) {
    return "El enlace de Google Maps no es válido. Revisa que esté completo.";
  }

  if (message.includes("ya existe un desarrollo")) {
    return "Ya existe un desarrollo con información duplicada. Revisa el título o la carpeta de imágenes.";
  }

  if (message.includes("datos del desarrollo no tienen el formato esperado")) {
    return "Algunos datos del desarrollo no tienen el formato correcto. Revisa dirección, entrega, modelos e imágenes.";
  }

  if (message.includes("desarrollo no encontrado")) {
    return context === "load_detail"
      ? "No encontramos el desarrollo solicitado."
      : "El desarrollo ya no existe o fue removido.";
  }

  if (message.includes("network error") || message.includes("error de conexión")) {
    return "No pudimos comunicarnos con el servidor. Verifica tu conexión o intenta nuevamente en unos minutos.";
  }

  if (rawMessage !== "Internal server error" && rawMessage !== "Error en el servidor. Inténtalo más tarde.") {
    return rawMessage;
  }

  return getFallbackMessage(context);
}

function getFallbackMessage(context: DevelopmentErrorContext) {
  switch (context) {
    case "load_list":
      return "No pudimos cargar los desarrollos en este momento. Intenta recargar la vista.";
    case "load_detail":
      return "No pudimos cargar el detalle del desarrollo en este momento.";
    case "create":
      return "No pudimos crear el desarrollo. Revisa la información general, la entrega, las imágenes y cada modelo agregado.";
    case "update":
      return "No pudimos actualizar el desarrollo. Revisa la información general, la entrega, las imágenes y cada modelo agregado.";
    case "delete":
      return "No fue posible eliminar el desarrollo en este momento.";
    default:
      return "Ocurrió un problema con el módulo de desarrollos.";
  }
}
