import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import type {
  CommercialScheme,
  DevelopmentAddress,
  DevelopmentRecord,
} from "@/interfaces/development.interface";
import { formatCurrency } from "@/modules/properties/utils/formatters";
import verIcon from "@/assets/images/Ver.png";
import descInfIcon from "@/assets/images/DescInf.png";
import { DownloadDevelopmentPdfButton } from "../utils/DownloadDevelopmentPdfButton";

interface DevelopmentsTableProps {
  data: DevelopmentRecord[];
  isLoading: boolean;
  canDelete: boolean;
  onDelete: (development: DevelopmentRecord) => void;
}

function getCommercialSchemes(development: DevelopmentRecord): CommercialScheme[] {
  const parentSchemes = Array.isArray(development.esquema_comercial)
    ? development.esquema_comercial
    : [];
  const modelSchemes = (development.modelos ?? []).flatMap((model) =>
    Array.isArray(model.esquema_comercial) ? model.esquema_comercial : [],
  );

  return [...parentSchemes, ...modelSchemes];
}

function getOperationsLabel(development: DevelopmentRecord): string {
  const operations = Array.from(
    new Set(
      getCommercialSchemes(development)
        .map((scheme) => scheme.tipo_operacion?.trim())
        .filter(Boolean),
    ),
  );

  return operations.length > 0 ? operations.join(" / ") : "Sin operación";
}

function getStartingPrice(development: DevelopmentRecord): number | null {
  const prices = getCommercialSchemes(development)
    .map((scheme) => Number(scheme.precio))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function formatDevelopmentAddress(direccion?: DevelopmentAddress): string {
  if (!direccion) return "Sin ubicación";

  const parts = [
    direccion.fraccionamiento?.trim(),
    direccion.municipio?.trim(),
    direccion.estado?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Sin ubicación";
}

function getCreatorName(development: DevelopmentRecord): string {
  const creator = development.creador;
  if (!creator) return "Sin registro";

  return [
    creator.nombres,
    creator.apellido_paterno,
    creator.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");
}

function getInitials(label: string): string {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getDeliveryLabel(development: DevelopmentRecord): string {
  if (development.entrega_inmediata === true) return "Inmediata";
  if (development.fecha_entrega) {
    return new Date(development.fecha_entrega).toLocaleDateString("es-MX");
  }
  return "Por definir";
}

export function DevelopmentsTable({
  data,
  isLoading,
  canDelete,
  onDelete,
}: DevelopmentsTableProps) {
  const navigate = useNavigate();
  const columns: ColumnDef<DevelopmentRecord>[] = useMemo(
    () => [
      {
        header: "Desarrollo",
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px] whitespace-normal align-top",
        render: (development) => (
          <div className="space-y-1 text-left">
            <p className="font-semibold text-slate-900">{development.titulo}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {development.slug}
            </p>
          </div>
        ),
      },
      {
        header: "Tipo de inmueble",
        render: (development) => (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {development.tipo_inmueble}
          </span>
        ),
      },
      {
        header: "Operación",
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px] whitespace-normal align-top",
        render: (development) => (
          <span className="font-medium text-slate-700">
            {getOperationsLabel(development)}
          </span>
        ),
      },
      {
        header: "Modelos",
        render: (development) => (
          <div className="text-center">
            <span className="text-lg font-bold text-[#312C85]">
              {development.modelos?.length ?? 0}
            </span>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              disponibles
            </p>
          </div>
        ),
      },
      {
        header: "Precio desde",
        headerClassName: "min-w-[160px]",
        cellClassName: "min-w-[160px] align-top",
        render: (development) => {
          const price = getStartingPrice(development);
          return (
            <span className="font-semibold text-[#4F5EF8]">
              {price == null ? "Sin precio" : formatCurrency(price)}
            </span>
          );
        },
      },
      {
        header: "Entrega",
        render: (development) => (
          <span className="font-medium text-slate-700">
            {getDeliveryLabel(development)}
          </span>
        ),
      },
      {
        header: "Ubicación",
        headerClassName: "min-w-[240px]",
        cellClassName: "min-w-[240px] whitespace-normal align-top",
        render: (development) => (
          <span className="text-sm leading-6 text-slate-600">
            {formatDevelopmentAddress(development.direccion)}
          </span>
        ),
      },
      {
        header: "Estado",
        render: (development) => (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {development.estatus}
          </span>
        ),
      },
      {
        header: "Registrado por",
        headerClassName: "min-w-[240px]",
        cellClassName: "min-w-[240px] align-top",
        render: (development) => {
          const fullName = getCreatorName(development);

          return (
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
                {getInitials(fullName || "SR")}
              </div>
              <div>
                <p className="font-medium text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-500">
                  {development.creador?.correo_electronico ?? "Sin correo"}
                </p>
              </div>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron desarrollos"
      wrapperClassName="rounded-2xl"
      tableClassName="w-max min-w-[1380px] text-left"
      actionsClassName="mx-auto flex w-max items-center justify-center gap-2"
      canDelete={canDelete}
      onDelete={onDelete}
      customActions={(development) => (
        <>
          <button
            type="button"
            aria-label="Ver detalles"
            title="Ver detalles"
            className="rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={() => navigate(`/modulos/desarrollos/${development.id}`)}
          >
            <img src={verIcon} alt="" className="h-5 w-5" aria-hidden="true" />
          </button>

          <DownloadDevelopmentPdfButton
            development={development}
            className="flex items-center justify-center rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-100"
          >
            {(loading) =>
              loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                <img src={descInfIcon} alt="Descargar" className="h-5 w-5" />
              )
            }
          </DownloadDevelopmentPdfButton>
        </>
      )}
    />
  );
}
