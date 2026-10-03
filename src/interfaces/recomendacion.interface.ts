export interface RecomendacionUsuario {
  id: number;
  nombres: string;
  apellido_paterno: string;
  foto_url?: string | null;
}

export interface RecomendacionRecord {
  id: number;
  contenido: string;
  referencia?: string | null;
  leida: boolean;
  leida_en: string | null;
  creado_en: string;
  de?: RecomendacionUsuario;
  para?: RecomendacionUsuario;
}
