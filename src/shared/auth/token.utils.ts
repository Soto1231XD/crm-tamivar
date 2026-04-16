type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpirationDate(token: string): Date | null {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const expirationDate = getTokenExpirationDate(token);

  if (!expirationDate) {
    return true;
  }

  return expirationDate.getTime() <= Date.now();
}
