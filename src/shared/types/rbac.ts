export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MARKETING'
  | 'RH'
  | 'ASESOR_VENTAS'
  | 'COORDINADOR_VENTAS';

export type ModuleKey = 'dashboard' | 'properties' | 'leads' | 'users' | 'hr';

export type AppUser = {
  id: number;
  fullName: string;
  email: string;
  roles: Role[];
};

