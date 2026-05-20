export type AppUser = {
  id: number;
  codigo_usuario?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo_electronico: string;
  folio_certificacion: string;
  foto_url: string;
  telefono?: string;
  roles: string[];
  permisos: string[];
  activo: boolean;
};

export type LoginCredentials = {
  correo_electronico: string;
  contrasena: string;
};

export type BackendLoginSuccess = {
  access_token: string;
  user: AppUser;
};

export type BackendLoginChallenge = {
  requires_2fa: true;
  challenge_id: string;
  message: string;
};

export type LoginApiResult =
  | {
      status: "authenticated";
      accessToken: string;
      user: AppUser;
    }
  | {
      status: "requires_2fa";
      challengeId: string;
      message: string;
    };
