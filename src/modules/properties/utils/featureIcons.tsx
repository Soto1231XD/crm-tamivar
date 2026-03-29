import React from 'react';
import IconSala from '@/assets/icons/sofa.png';
import IconComedor from '@/assets/icons/restaurante.png';
import IconCocina from '@/assets/icons/horno.png';
import IconAlberca from '@/assets/icons/nadador.png';
import IconJardin from '@/assets/icons/jardin.png';
import IconTerraza from '@/assets/icons/terraza.png';
import IconMueble from '@/assets/icons/cajon.png';
import IconBodega from '@/assets/icons/bodega.png';
import IconServicio from '@/assets/icons/area-servicio.png';
import IconPatio from '@/assets/icons/patio.png';
import IconAire from '@/assets/icons/aire-acondicionado.png';
import IconBoiler from '@/assets/icons/boiler.png';

export const getFeatureIcon = (featureKey: string): React.ReactNode => {
  const iconClass = "w-5 h-5 sm:w-6 sm:h-6 object-contain mb-1";

  switch (featureKey) {
    case 'sala':
      return <img src={IconSala} className={iconClass} alt="Sala" />;
    case 'comedor':
      return <img src={IconComedor} className={iconClass} alt="Comedor" />;
    case 'cocina':
      return <img src={IconCocina} className={iconClass} alt="Cocina" />;
    case 'alberca':
      return <img src={IconAlberca} className={iconClass} alt="Alberca" />;
    case 'jardin':
      return <img src={IconJardin} className={iconClass} alt="Jardin" />;
    case 'terraza':
      return <img src={IconTerraza} className={iconClass} alt="Terraza" />;
    case 'amueblado':
      return <img src={IconMueble} className={iconClass} alt="Mueble" />;
    case 'bodega':
      return <img src={IconBodega} className={iconClass} alt="Bodega" />;
    case 'area_servicio':
      return <img src={IconServicio} className={iconClass} alt="Servicio" />;
    case 'patio':
      return <img src={IconPatio} className={iconClass} alt="Patio" />;
    case 'aire_acondicionado':
      return <img src={IconAire} className={iconClass} alt="Aire Acondicionado" />;
    case 'boiler':
      return <img src={IconBoiler} className={iconClass} alt="Boiler" />;
    default:
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>; // Check por defecto
  }
};