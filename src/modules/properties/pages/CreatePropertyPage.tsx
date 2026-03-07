import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyForm } from '../components/PropertyForm';
import { createProperty, type CreatePropertyPayload } from '../services/properties.api';
import { useAuth } from '../../../shared/context/AuthContext';

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCancel() {
    navigate('/modulos/properties');
  }

  async function handleCreateProperty(payload: Omit<CreatePropertyPayload, 'creado_por_id'>): Promise<string | null> {
    if (!user?.id) {
      return 'No hay una sesión válida para asociar el creador.';
    }

    try {
      setIsSubmitting(true);
      const createdPayload: CreatePropertyPayload = {
        ...payload,
        creado_por_id: user.id,
      };
      await createProperty(createdPayload, accessToken);
      navigate('/modulos/properties');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear la propiedad.';
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PropertyForm
      title="Registrar nueva propiedad"
      submitLabel="Crear"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleCreateProperty}
    />
  );
}
