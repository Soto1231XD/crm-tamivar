import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PropertyForm } from '../components/PropertyForm';
import { getProperties, updateProperty, type CreatePropertyPayload, type PropertyRecord } from '../services/properties.api';
import { useAuth } from '../../../shared/context/AuthContext';

export function EditPropertyPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const { accessToken } = useAuth();
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    getProperties()
      .then((data) => {
        if (!active) return;
        const match = data.find((item) => String(item.id) === propertyId) ?? null;
        if (!match) {
          setLoadError('No se encontro la propiedad.');
          return;
        }
        setProperty(match);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'No fue posible cargar la propiedad.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertyId]);

  function handleCancel() {
    navigate('/modulos/properties');
  }

  async function handleEditProperty(payload: Omit<CreatePropertyPayload, 'creado_por_id'>): Promise<string | null> {
    if (!property) return 'No se encontro la propiedad.';

    try {
      setIsSubmitting(true);
      await updateProperty(property.id, payload, accessToken);
      navigate('/modulos/properties');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar la propiedad.';
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Cargando propiedad...
      </section>
    );
  }

  if (loadError || !property) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-red-600">{loadError || 'No se encontro la propiedad.'}</p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white"
        >
          Volver
        </button>
      </section>
    );
  }

  return (
    <PropertyForm
      property={property}
      title="Editar propiedad"
      submitLabel="Guardar cambios"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleEditProperty}
    />
  );
}
