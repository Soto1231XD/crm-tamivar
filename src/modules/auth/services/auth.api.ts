import { normalizeBackendRole } from '../../../shared/constants/roles';
import type { AppUser, LoginCredentials, Role } from '../../../shared/types/rbac';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

type BackendLoginSuccess = {
  access_token: string;
  user: {
    id: number;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    correo_electronico: string;
    rol?: {
      rol?: string;
    };
  };
};

type BackendLoginChallenge = {
  requires_2fa: true;
  challenge_id: string;
  message: string;
};

export type LoginApiResult =
  | {
      status: 'authenticated';
      accessToken: string;
      user: AppUser;
    }
  | {
      status: 'requires_2fa';
      challengeId: string;
      message: string;
    };

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : 'No fue posible procesar la solicitud de autenticacion.';
    throw new Error(message);
  }

  return data as TResponse;
}

function mapBackendUserToAppUser(user: BackendLoginSuccess['user']): AppUser {
  const roleName = user.rol?.rol ?? '';
  const normalizedRole = normalizeBackendRole(roleName);
  const fullName = [user.nombres, user.apellido_paterno]
    .filter(Boolean)
    .join(' ')
    .trim();
  const roles: Role[] = normalizedRole ? [normalizedRole] : [];

  return {
    id: user.id,
    fullName: fullName || user.correo_electronico,
    nombres: user.nombres,
    apellidoPaterno: user.apellido_paterno,
    email: user.correo_electronico,
    roles,
  };
}

export async function loginApi(credentials: LoginCredentials): Promise<LoginApiResult> {
  const data = await postJson<BackendLoginSuccess | BackendLoginChallenge>('/auth/login', credentials);

  if ('requires_2fa' in data) {
    return {
      status: 'requires_2fa',
      challengeId: data.challenge_id,
      message: data.message,
    };
  }

  return {
    status: 'authenticated',
    accessToken: data.access_token,
    user: mapBackendUserToAppUser(data.user),
  };
}

export async function verifyTwoFaApi(challengeId: string, codigo: string): Promise<{
  accessToken: string;
  user: AppUser;
}> {
  const data = await postJson<BackendLoginSuccess>('/auth/verify-2fa', {
    challenge_id: challengeId,
    codigo,
  });

  return {
    accessToken: data.access_token,
    user: mapBackendUserToAppUser(data.user),
  };
}
