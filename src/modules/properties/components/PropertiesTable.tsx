import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import { STATUS_OPTIONS } from "../utils/property-constants";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";
import descInfIcon from "@/assets/images/DescInf.png";
import verIcon from "@/assets/images/Ver.png";
import {
  formatDireccion,
  getPropertyStatusStyles,
  formatCurrency,
  calculateFinalPrice,
  getFullImageUrl,
} from "../utils/formatters";

interface PropertiesTableProps {
  data: PropertyRecord[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (property: PropertyRecord) => void;
}

export function PropertiesTable({
  data,
  isLoading,
  canEdit,
  canDelete,
  onDelete,
}: PropertiesTableProps) {
  const navigate = useNavigate();
  const { editProperty } = usePropertiesStore();
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const handleStatusChange = async (id: number, nextStatus: string) => {
    setUpdatingStatusId(id);
    try {
      await editProperty(id, { estatus: nextStatus });
      toast.success(`El estado de la propiedad cambió a ${nextStatus}.`);
    } catch {
      toast.error("No fue posible actualizar el estado de la propiedad.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const columns: ColumnDef<PropertyRecord>[] = useMemo(
    () => [
      {
        header: "Propiedad",
        headerClassName: "min-w-[200px]",
        cellClassName: "min-w-[200px] whitespace-normal align-top",
        render: (property) => (
          <span className="font-medium text-slate-800">
            {property.titulo || "Sin título"}
          </span>
        ),
      },
      {
        header: "Tipo de inmueble",
        render: (property) => (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {property.tipo_inmueble}
          </span>
        ),
      },
      {
        header: "Operación",
        render: (property) => (
          <div className="flex flex-col gap-1.5 items-start">
            {property.esquema_comercial.map((esquema, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 ring-1 ring-inset ring-slate-200"
              >
                {esquema.tipo_operacion}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: "Exclusivo",
        headerClassName: "w-[100px]",
        cellClassName: "w-[100px] align-top",
        render: (property) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              property.exclusiva
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "text-slate-500"
            }`}
          >
            {property.exclusiva ? "Sí" : "No"}
          </span>
        ),
      },
      {
        header: "Dirección",
        headerClassName: "w-[320px]",
        cellClassName: "w-[320px] whitespace-normal align-top",
        render: (property) => (
          <div className="min-w-[300px] max-w-[320px] break-words text-sm leading-6 text-slate-600">
            {formatDireccion(property.direccion)}
          </div>
        ),
      },
      {
        header: "Precio (MXN)",
        headerClassName: "w-[160px]",
        cellClassName: "w-[160px] align-top",
        render: (property) => (
          <div className="flex flex-col gap-2 justify-center mt-0.5">
            {property.esquema_comercial.map((esquema, idx) => {
              const { finalPrice } = calculateFinalPrice(
                esquema.precio,
                esquema.descuento_cantidad,
              );

              return (
                <span
                  key={idx}
                  className="whitespace-nowrap font-semibold text-[#4F5EF8] leading-tight"
                >
                  <span className="text-xs text-slate-400 font-medium mr-1.5">
                    {esquema.tipo_operacion.charAt(0).toUpperCase()}:
                  </span>
                  {formatCurrency(finalPrice)}
                </span>
              );
            })}
          </div>
        ),
      },
      {
        header: "Registrado por",
        headerClassName: "min-w-[250px]",
        cellClassName: "min-w-[250px] align-top",
        render: (property) => (
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <div className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
              {property.creador?.foto_url ? (
                <img
                  src={getFullImageUrl(property.creador.foto_url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                `${property.creador?.nombres?.[0] || ""}${property.creador?.apellido_paterno?.[0] || ""}`
              )}
            </div>
            <span>{`${property.creador?.nombres || ""} ${property.creador?.apellido_paterno || ""}`}</span>
          </div>
        ),
      },
      {
        header: "Estado",
        render: (property) => (
          <BadgeSelect
            value={property.estatus}
            options={STATUS_OPTIONS}
            onChange={(val) => handleStatusChange(property.id, val)}
            disabled={updatingStatusId === property.id}
            canEdit={canEdit}
            getStyles={getPropertyStatusStyles}
            omitFirstOption={true}
          />
        ),
      },
    ],
    [updatingStatusId, canEdit],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron propiedades"
      wrapperClassName="rounded-2xl"
      tableClassName="min-w-full text-left"
      actionsClassName="mx-auto flex w-max items-center justify-center gap-2"
      canEdit={canEdit}
      canDelete={canDelete}
      onEdit={(property) =>
        navigate(`/modulos/propiedades/${property.id}/editar`)
      }
      onDelete={onDelete}
      customActions={(property) => (
        <>
          <button
            type="button"
            aria-label="Ver detalles"
            title="Ver detalles"
            className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => navigate(`/modulos/propiedades/${property.id}`)}
          >
            <img src={verIcon} alt="" className="h-5 w-5" aria-hidden="true" />
          </button>

          <DownloadPdfButton
            property={property}
            className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            {(loading) =>
              loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
              ) : (
                <img src={descInfIcon} alt="Descargar" className="h-5 w-5" />
              )
            }
          </DownloadPdfButton>
        </>
      )}
    />
  );
}