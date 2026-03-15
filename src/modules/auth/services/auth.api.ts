import { apiRequest } from '../../../shared/apiRequest';
import { normalizeBackendRole } from '../../../shared/constants/roles';
import type { AppUser, LoginCredentials, Role } from '../../../shared/types/rbac';

type BackendLoginSuccess = {
  access_token: string;
  user: {
    id: number;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    correo_electronico: string;
    roles?: string[];
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

function mapBackendUserToAppUser(user: BackendLoginSuccess['user']): AppUser {
  const backendRoles = user.roles?.length ? user.roles : user.rol?.rol ? [user.rol.rol] : [];
  const normalizedRoles = backendRoles
    .map((roleName) => normalizeBackendRole(roleName))
    .filter((role): role is Role => Boolean(role));
  const fullName = [user.nombres, user.apellido_paterno].filter(Boolean).join(' ').trim();

  return {
    id: user.id,
    fullName: fullName || user.correo_electronico,
    nombres: user.nombres,
    apellidoPaterno: user.apellido_paterno,
    email: user.correo_electronico,
    roles: normalizedRoles,
  };
}

export async function loginApi(credentials: LoginCredentials): Promise<LoginApiResult> {
  const data = await apiRequest<BackendLoginSuccess | BackendLoginChallenge>('/auth/login', {
    method: 'POST',
    data: credentials,
  });

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
  const data = await apiRequest<BackendLoginSuccess>('/auth/verify-2fa', {
    method: 'POST',
    data: {
      challenge_id: challengeId.trim(),
      codigo: codigo.trim(),
    },
  });

  return {
    accessToken: data.access_token,
    user: mapBackendUserToAppUser(data.user),
  };
}
