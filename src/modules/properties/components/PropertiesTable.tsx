import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getReadableErrorMessage } from "@/shared/utils/errorMessages";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import descInfIcon from "@/assets/images/DescInf.png";
import verIcon from "@/assets/images/Ver.png";
import {
  formatDireccion,
  getPropertyStatusStyles,
  formatCurrency,
  calculateFinalPrice,
} from "../utils/formatters";

interface PropertiesTableProps {
  data: PropertyRecord[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  statusOptions: readonly string[];
  onDelete: (property: PropertyRecord) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PropertiesTable({
  data,
  isLoading,
  canEdit,
  canDelete,
  statusOptions,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: PropertiesTableProps) {
  const navigate = useNavigate();
  const { editProperty } = usePropertiesStore();
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const handleStatusChange = async (id: number, nextStatus: string) => {
    setUpdatingStatusId(id);
    try {
      await editProperty(id, { estatus: nextStatus });
      toast.success(`El estado de la propiedad cambió a ${nextStatus}.`);
    } catch (error) {
      toast.error(
        getReadableErrorMessage(
          error,
          "No fue posible actualizar el estado de la propiedad.",
        ),
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const columns: ColumnDef<PropertyRecord>[] = useMemo(
    () => [
      {
        header: "Propiedad",
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px] whitespace-normal align-top",
        render: (property) => (
          <PropertyTitleCell
            property={property}
            onNavigate={() => navigate(`/modulos/propiedades/${property.id}`)}
          />
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
        headerClassName: "min-w-[260px]",
        cellClassName: "min-w-[260px] whitespace-normal align-top",
        render: (property) => (
          <div className="min-w-[240px] max-w-[280px] break-words text-sm leading-6 text-slate-600">
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
        header: "Estado",
        render: (property) => (
          <BadgeSelect
            value={property.estatus}
            options={statusOptions}
            onChange={(val) => handleStatusChange(property.id, val)}
            disabled={updatingStatusId === property.id}
            canEdit={canEdit}
            getStyles={getPropertyStatusStyles}
            omitFirstOption={true}
          />
        ),
      },
    ],
    [updatingStatusId, canEdit, statusOptions],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron propiedades"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      wrapperClassName="rounded-2xl"
      tableClassName="w-full min-w-[1240px] text-left"
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

function PropertyTitleCell({
  property,
  onNavigate,
}: {
  property: PropertyRecord;
  onNavigate: () => void;
}) {
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainImage = property.imagenes?.find((img) => img.principal) ?? property.imagenes?.[0];

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top - 8, left: rect.left });
  }

  function handleMouseLeave() {
    hideTimer.current = setTimeout(() => setTooltipPos(null), 80);
  }

  return (
    <>
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onNavigate}
        className="text-left font-medium text-slate-800 hover:text-[#4F5EF8] hover:underline transition-colors cursor-pointer"
      >
        {property.titulo || "Sin título"}
      </button>

      {tooltipPos && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translateY(-100%)",
            zIndex: 9999,
          }}
          className="pointer-events-none w-56 overflow-hidden rounded-xl bg-slate-900 shadow-xl"
        >
          {mainImage ? (
            <img
              src={getFullImageUrl(mainImage.url)}
              alt={property.titulo}
              className="h-36 w-full object-cover"
            />
          ) : (
            <div className="flex h-36 w-full items-center justify-center bg-slate-800 text-xs text-slate-400">
              Sin imagen
            </div>
          )}
          <p className="px-3 py-2 text-xs font-medium leading-4 text-white">
            {property.titulo || "Sin título"}
          </p>
          <span className="absolute left-4 top-full h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-900" />
        </div>
      )}
    </>
  );
}
