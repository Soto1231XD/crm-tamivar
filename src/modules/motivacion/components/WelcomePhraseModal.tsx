import { useEffect, useState } from 'react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { isSalesAdvisorOnly } from '@/shared/auth/role.utils';

const FRASES = [
  {
    frase: 'Cada "no" que escuchas te acerca un paso más al "sí" que buscas.',
    autor: 'Principio de ventas',
  },
  {
    frase: 'El éxito no es el resultado de la suerte, sino de la constancia que nadie ve.',
    autor: 'Mentalidad ganadora',
  },
  {
    frase: 'Tu actitud de hoy es la que define tus resultados de mañana.',
    autor: 'Filosofía de ventas',
  },
  {
    frase: 'Las personas exitosas hacen lo que las demás evitan. Por eso son exitosas.',
    autor: 'Jim Rohn',
  },
  {
    frase: 'No vendas un producto, ofrece una solución. La diferencia está en cómo lo presentas.',
    autor: 'Arte de vender',
  },
  {
    frase: 'Cada cliente satisfecho es la mejor publicidad que puedes tener.',
    autor: 'Principio de servicio',
  },
  {
    frase: 'La diferencia entre un buen vendedor y uno excelente es la preparación.',
    autor: 'Mentalidad de élite',
  },
  {
    frase: 'No te compares con los demás. Compárate con quien eras ayer.',
    autor: 'Crecimiento personal',
  },
  {
    frase: 'El mejor momento para empezar fue ayer. El segundo mejor momento es ahora.',
    autor: 'Proverbio chino',
  },
  {
    frase: 'Un cliente bien atendido hoy es un cliente fiel mañana.',
    autor: 'Filosofía Tamivar',
  },
  {
    frase: 'Tu energía es contagiosa. Lleva hoy la mejor versión de ti al trabajo.',
    autor: 'Liderazgo positivo',
  },
  {
    frase: 'Las metas grandes requieren pasos pequeños y constantes. Sigue adelante.',
    autor: 'Disciplina diaria',
  },
];

const STORAGE_KEY = 'tamivar_welcome_fecha';

function getFechaHoy() {
  return new Date().toISOString().slice(0, 10); // "2026-10-02"
}

function getFraseDelDia() {
  const dia = new Date().getDate();
  return FRASES[dia % FRASES.length];
}

function yaSeVioHoy(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === getFechaHoy();
  } catch {
    return false;
  }
}

function marcarVisto() {
  try {
    localStorage.setItem(STORAGE_KEY, getFechaHoy());
  } catch {
    // ignore
  }
}

export function WelcomePhraseModal() {
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);

  const esAsesor = user ? isSalesAdvisorOnly(user) : false;

  useEffect(() => {
    if (!esAsesor) return;
    if (!yaSeVioHoy()) setVisible(true);
  }, [esAsesor]);

  function cerrar() {
    marcarVisto();
    setVisible(false);
  }

  if (!visible) return null;

  const { frase, autor } = getFraseDelDia();
  const nombre = user?.nombres ?? 'Asesor';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Franja superior decorativa */}
        <div className="h-2 w-full bg-gradient-to-r from-[#312C85] via-[#4f46e5] to-[#7c3aed]" />

        <div className="px-8 pb-8 pt-7 text-center">
          {/* Ícono */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#312C85]/10">
            <svg
              className="h-8 w-8 text-[#312C85]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </div>

          {/* Saludo */}
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#312C85]">
            ¡Bienvenido, {nombre}!
          </p>

          {/* Frase */}
          <blockquote className="mt-4 text-xl font-bold leading-snug text-slate-900">
            "{frase}"
          </blockquote>

          <p className="mt-3 text-xs font-medium text-slate-400">— {autor}</p>

          {/* Separador */}
          <div className="mx-auto mt-6 h-px w-12 bg-slate-200" />

          <p className="mt-4 text-sm text-slate-500">
            Hoy es un gran día para cerrar ese trato que estás buscando.
          </p>

          {/* Botón */}
          <button
            type="button"
            onClick={cerrar}
            className="mt-7 w-full rounded-2xl bg-[#312C85] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#27226f] active:scale-[0.98]"
          >
            ¡A darle! 💪
          </button>
        </div>
      </div>
    </div>
  );
}
