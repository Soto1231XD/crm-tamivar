import { apiRequest } from '@/shared/apiRequest';

const BASE = '/evaluacion';

// ── Types ───────────────────────────────────────────────────────────────────

export interface UsuarioResumen {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  foto_url: string | null;
  codigo_usuario: string | null;
}

export interface AdvisorScoreRow {
  usuario: UsuarioResumen;
  mes: number;
  anio: number;
  visitas: number;
  cierres: number;
  apartados: number;
  juntas_totales: number;
  juntas_asistidas: number;
  publicaciones: number;
  examenes_completados: number;
  calificacion_promedio: number | null;
}

export interface JuntaConAsistencia {
  id: number;
  titulo: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  presente?: boolean;
  asistencias: Array<{
    junta_id: number;
    usuario_id: number;
    presente: boolean;
    usuario: Pick<UsuarioResumen, 'id' | 'nombres' | 'apellido_paterno' | 'foto_url'>;
  }>;
  creador: Pick<UsuarioResumen, 'id' | 'nombres' | 'apellido_paterno'>;
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string | null;
  archivo_url: string;
  url_publicacion: string | null;
  estado_validacion: 'pendiente' | 'aceptado' | 'rechazado';
  validado_en: string | null;
  creado_en: string;
  usuario: Pick<UsuarioResumen, 'id' | 'nombres' | 'apellido_paterno' | 'foto_url'>;
}

export interface ExamenPregunta {
  id: number;
  orden: number;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'texto_libre';
  pregunta: string;
  opciones: string[] | null;
  respuesta_correcta: string | null;
  puntos: number;
}

export interface ExamenAsignacion {
  id: number;
  examen_id: number;
  usuario_id: number;
  calificacion: number | null;
  completado_en: string | null;
  creado_en: string;
  examen?: { id: number; titulo: string };
  respuestas?: Array<{ pregunta_id: number; respuesta: string; calificacion: number | null }>;
  usuario?: Pick<UsuarioResumen, 'id' | 'nombres' | 'apellido_paterno'>;
}

export interface Examen {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  creado_en: string;
  creador: Pick<UsuarioResumen, 'id' | 'nombres' | 'apellido_paterno'>;
  preguntas: ExamenPregunta[];
  asignaciones: ExamenAsignacion[];
}

export interface AdvisorDetalle extends Omit<AdvisorScoreRow, 'publicaciones'> {
  juntas_detalle: Array<JuntaConAsistencia & { presente: boolean }>;
  publicaciones_count: number;
  publicaciones: Publicacion[];
  examenes: ExamenAsignacion[];
}

// ── API calls ────────────────────────────────────────────────────────────────

export function getScoreboard(mes: number, anio: number): Promise<AdvisorScoreRow[]> {
  return apiRequest(`${BASE}/resumen`, { params: { mes, anio } });
}

export function getResumenAsesor(
  userId: number,
  mes: number,
  anio: number,
): Promise<AdvisorDetalle> {
  return apiRequest(`${BASE}/resumen/${userId}`, { params: { mes, anio } });
}

export function getJuntas(): Promise<JuntaConAsistencia[]> {
  return apiRequest(`${BASE}/juntas`);
}

export function createJunta(data: {
  titulo: string;
  descripcion?: string;
  fecha: string;
  tipo?: string;
}): Promise<JuntaConAsistencia> {
  return apiRequest(`${BASE}/juntas`, { method: 'POST', data });
}

export function deleteJunta(id: number): Promise<void> {
  return apiRequest(`${BASE}/juntas/${id}`, { method: 'DELETE' });
}

export function updateAsistencia(
  juntaId: number,
  asistencias: Array<{ usuario_id: number; presente: boolean }>,
): Promise<JuntaConAsistencia> {
  return apiRequest(`${BASE}/juntas/${juntaId}/asistencia`, {
    method: 'PATCH',
    data: { asistencias },
  });
}

export function getPublicaciones(): Promise<Publicacion[]> {
  return apiRequest(`${BASE}/publicaciones`);
}

export function createPublicacion(titulo: string, descripcion: string, file: File, urlPublicacion?: string): Promise<Publicacion> {
  const form = new FormData();
  form.append('titulo', titulo);
  if (descripcion) form.append('descripcion', descripcion);
  form.append('file', file);
  if (urlPublicacion) form.append('url_publicacion', urlPublicacion);
  return apiRequest(`${BASE}/publicaciones`, { method: 'POST', data: form });
}

export function validarPublicacion(id: number, estado: 'aceptado' | 'rechazado'): Promise<Publicacion> {
  return apiRequest(`${BASE}/publicaciones/${id}/validar`, { method: 'PATCH', data: { estado } });
}

export function deletePublicacion(id: number): Promise<void> {
  return apiRequest(`${BASE}/publicaciones/${id}`, { method: 'DELETE' });
}

export function getExamenes(): Promise<Examen[]> {
  return apiRequest(`${BASE}/examenes`);
}

export function createExamen(data: {
  titulo: string;
  descripcion?: string;
  fecha_limite?: string;
  preguntas: Array<{
    orden: number;
    tipo: string;
    pregunta: string;
    opciones?: string[];
    respuesta_correcta?: string;
    puntos?: number;
  }>;
}): Promise<Examen> {
  return apiRequest(`${BASE}/examenes`, { method: 'POST', data });
}

export function deleteExamen(id: number): Promise<void> {
  return apiRequest(`${BASE}/examenes/${id}`, { method: 'DELETE' });
}

export function asignarExamen(examenId: number, usuario_ids: number[]): Promise<Examen> {
  return apiRequest(`${BASE}/examenes/${examenId}/asignar`, {
    method: 'POST',
    data: { usuario_ids },
  });
}

export function submitRespuestas(
  examenId: number,
  respuestas: Array<{ pregunta_id: number; respuesta: string }>,
): Promise<ExamenAsignacion> {
  return apiRequest(`${BASE}/examenes/${examenId}/responder`, {
    method: 'POST',
    data: { respuestas },
  });
}

export function getExamenResultados(examenId: number): Promise<Examen> {
  return apiRequest(`${BASE}/examenes/${examenId}/resultados`);
}

export function calificarRespuestaLibre(
  asignacionId: number,
  preguntaId: number,
  correcto: boolean,
): Promise<ExamenAsignacion> {
  return apiRequest(`${BASE}/examenes/${asignacionId}/calificar-respuesta`, {
    method: 'PATCH',
    data: { pregunta_id: preguntaId, correcto },
  });
}

export function setCalificacion(
  userId: number,
  mes: number,
  anio: number,
  calificacion: number,
): Promise<void> {
  return apiRequest(`${BASE}/calificacion/${userId}`, {
    method: 'PATCH',
    data: { mes, anio, calificacion },
  });
}
