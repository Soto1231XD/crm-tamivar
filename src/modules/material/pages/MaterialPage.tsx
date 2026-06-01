"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type MaterialCategory = {
  id: string;
  title: string;
  description: string;
  helper: string;
  href?: string;
  icon: (props: { className?: string }) => ReactElement;
};

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: "videos",
    title: "Videos",
    description:
      "Recursos audiovisuales de las propiedades, promocion y apoyo comercial del equipo.",
    helper: "Carpeta disponible en Google Drive",
    href: "https://drive.google.com/drive/folders/1woo6QEqqJJliOPwptEQOPV8ldw5aUx7n?usp=sharing",
    icon: VideoIcon,
  },
  {
    id: "branding",
    title: "Branding",
    description:
      "Logos, lineamientos visuales, plantillas y piezas listas para mantener la identidad TAMIVAR.",
    helper: "Carpeta disponible en Google Drive",
    href: "https://drive.google.com/drive/folders/1BXt9bXB2V_Xd16ojkvD93RuKlzK8wBTb?usp=sharing",
    icon: BrandingIcon,
  },
  {
    id: "documentacion",
    title: "Documentacion",
    description:
      "Procesos y archivos de documentacion para distintas fases de administracion.",
    helper: "Carpeta disponible en Google Drive",
    href: "https://drive.google.com/drive/folders/1xMP5_sG49u60Ib0pycXX7iWwCa-EhU3v?usp=sharing",
    icon: DocumentIcon,
  },
];

function ArrowUpRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function VideoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5.5" width="13" height="13" rx="2.5" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

function BrandingIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 16c0-4 4-8 8-8 4.4 0 8 3.6 8 8 0 2.8-2.2 5-5 5h-1.5a1.5 1.5 0 0 1 0-3H15a2 2 0 0 0 0-4c-2 0-3.5 1.6-3.5 3.5S10 21 8 21c-2.2 0-4-2.2-4-5Z" />
      <circle cx="8.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function MaterialPage() {
  const handleCategoryClick = (category: MaterialCategory) => {
    if (!category.href) {
      toast("Aun no hemos definido el enlace de esta categoria.");
      return;
    }

    window.open(category.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-5 py-5 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex w-fit rounded-full border border-[var(--crm-border)] bg-[var(--crm-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
            Centro de recursos
          </span>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[var(--crm-text)]">
              Material
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-[var(--crm-text-muted)] sm:text-[15px]">
              Aqui vamos a concentrar recursos internos de apoyo para el equipo.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 2xl:grid-cols-3">
        {MATERIAL_CATEGORIES.map((category, index) => {
          const Icon = category.icon;

          return (
            <motion.button
              key={category.id}
              type="button"
              aria-label={`Abrir material de ${category.title}`}
              onClick={() => handleCategoryClick(category)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.06 }}
              className="group relative text-left focus:outline-none"
            >
              <div className="relative mx-auto w-full max-w-[460px] pt-8">
                <div className="absolute left-6 top-0 z-10 h-10 w-36 rounded-t-[18px] border-[2px] border-b-0 border-[var(--crm-text)] bg-[var(--crm-surface)]" />

                <div className="relative min-h-[220px] overflow-hidden rounded-b-[26px] rounded-r-[26px] rounded-tl-[10px] rounded-tr-[26px] border-[2px] border-[var(--crm-text)] bg-[var(--crm-surface)] px-6 pb-5 pt-8 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.45)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_25px_40px_-20px_rgba(15,23,42,0.25)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
                        Carpeta
                      </p>

                      <h2 className="mt-2 text-[28px] font-black tracking-tight text-[var(--crm-text)]">
                        {category.title}
                      </h2>
                    </div>

                    <div className="mt-1 text-[var(--crm-text-muted)]">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
                      Contenido
                    </p>

                    <p className="text-[15px] leading-8 text-[var(--crm-text-muted)]">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--crm-border)]/70 pt-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
                        Estado
                      </p>

                      <p className="mt-2 text-sm font-medium text-[var(--crm-text)]">
                        {category.helper}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--crm-primary)]">
                      {category.href ? "Abrir" : "Pendiente"}
                      <ArrowUpRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </section>
    </div>
  );
}
