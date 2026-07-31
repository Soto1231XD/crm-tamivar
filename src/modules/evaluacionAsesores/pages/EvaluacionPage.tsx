import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import {
  getScoreboard,
  getJuntas,
  getPublicaciones,
  getExamenes,
  type AdvisorScoreRow,
  type JuntaConAsistencia,
  type Publicacion,
  type Examen,
} from "../services/evaluacion.api";
import { ScoreboardTab } from "../components/ScoreboardTab";
import { JuntasTab } from "../components/JuntasTab";
import { PublicacionesTab } from "../components/PublicacionesTab";
import { ExamenesTab } from "../components/ExamenesTab";

// ── Tab component (inline, small) ─────────────────────────────────────────────

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-colors ${
        active
          ? "border-[var(--crm-primary)] text-[var(--crm-primary)] bg-[var(--crm-primary-soft)]"
          : "border-transparent text-[var(--crm-text-soft)] hover:text-[var(--crm-text)]"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabKey = "scoreboard" | "juntas" | "publicaciones" | "examenes";

export function EvaluacionPage() {
  const user = useAuthStore((s) => s.user);
  const perms = user?.permisos ?? [];
  const canSeeAll = perms.includes("evaluacion:leer_todos") || perms.includes("*:*");
  const canGestionar = perms.includes("evaluacion:gestionar") || perms.includes("*:*");
  const currentUserId = user?.id ?? 0;

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<TabKey>("scoreboard");

  const [scoreRows, setScoreRows] = useState<AdvisorScoreRow[]>([]);
  const [juntas, setJuntas] = useState<JuntaConAsistencia[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loadingScore, setLoadingScore] = useState(false);

  const loadScore = useCallback(async () => {
    setLoadingScore(true);
    try {
      const data = await getScoreboard(mes, anio);
      if (Array.isArray(data)) {
        setScoreRows(data);
      } else {
        const d = data as unknown as AdvisorScoreRow & { publicaciones_count: number };
        setScoreRows([{ ...d, publicaciones: d.publicaciones_count }]);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al cargar datos.");
    } finally {
      setLoadingScore(false);
    }
  }, [mes, anio]);

  useEffect(() => { loadScore(); }, [loadScore]);

  useEffect(() => {
    getJuntas().then(setJuntas).catch(() => {});
    getPublicaciones().then(setPublicaciones).catch(() => {});
    getExamenes().then(setExamenes).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--crm-text)]">Evaluación de Asesores</h1>
        <p className="text-sm text-[var(--crm-text-soft)] mt-0.5">
          {canSeeAll
            ? "Resumen de desempeño del equipo de ventas."
            : "Tu resumen de desempeño mensual."}
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--crm-border)] overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
        <Tab active={activeTab === "scoreboard"} onClick={() => setActiveTab("scoreboard")}>
          {canSeeAll ? "Tabla general" : "Mi resumen"}
        </Tab>
        <Tab active={activeTab === "juntas"} onClick={() => setActiveTab("juntas")}>
          Juntas
        </Tab>
        <Tab active={activeTab === "publicaciones"} onClick={() => setActiveTab("publicaciones")}>
          Publicaciones
        </Tab>
        <Tab active={activeTab === "examenes"} onClick={() => setActiveTab("examenes")}>
          Exámenes
        </Tab>
      </div>

      {activeTab === "scoreboard" && (
        <ScoreboardTab
          rows={scoreRows}
          loading={loadingScore}
          mes={mes}
          anio={anio}
          onMesChange={(m) => setMes(m)}
          onAnioChange={(a) => setAnio(a)}
          canSeeAll={canSeeAll}
          canGestionar={canGestionar}
          onGradeSet={(userId, cal) =>
            setScoreRows((prev) =>
              prev.map((r) =>
                r.usuario.id === userId ? { ...r, calificacion_promedio: cal } : r,
              ),
            )
          }
        />
      )}

      {activeTab === "juntas" && (
        <JuntasTab
          juntas={juntas}
          canGestionar={canGestionar}
          currentUserId={currentUserId}
          onCreated={(j) => setJuntas((prev) => [j, ...prev])}
          onDeleted={(id) => setJuntas((prev) => prev.filter((j) => j.id !== id))}
          onAsistenciaUpdated={(updated) =>
            setJuntas((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
          }
        />
      )}

      {activeTab === "publicaciones" && (
        <PublicacionesTab
          publicaciones={publicaciones}
          currentUserId={currentUserId}
          canSeeAll={canSeeAll}
          mes={mes}
          anio={anio}
          onCreated={(p) => setPublicaciones((prev) => [p, ...prev])}
          onDeleted={(id) => setPublicaciones((prev) => prev.filter((p) => p.id !== id))}
          onValidated={(updated) => setPublicaciones((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
        />
      )}

      {activeTab === "examenes" && (
        <ExamenesTab
          examenes={examenes}
          canGestionar={canGestionar}
          currentUserId={currentUserId}
          onCreated={(e) => setExamenes((prev) => [e, ...prev])}
          onDeleted={(id) => setExamenes((prev) => prev.filter((e) => e.id !== id))}
          onSubmitted={(examenId) => {
            getExamenes().then(setExamenes).catch(() => {});
            void examenId;
          }}
        />
      )}
    </div>
  );
}
