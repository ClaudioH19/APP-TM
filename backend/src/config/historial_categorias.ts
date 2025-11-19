// tipos de eventos
export const EVENT_TYPE_GROUPS = {
  salud_veterinario: [
    'vacuna',
    'desparasitacion',
    'cita_medica',
    'control_general',
    'analisis',
    'cirugia',
    'curacion',
  ],
  higiene_estetica: [
    'bano',
    'aseo',
    'corte_pelo',
    'corte_unas',
    'limpieza_dental',
  ],
  actividad: [
    'paseo',
    'entrenamiento',
    'guarderia',
    'juego',
  ],
  alimentacion: [
    'cambio_alimentacion',
    'compra_alimento',
  ],
  otros: [
    'medicacion',
    'evento',
    'otro',
  ],
} as const;

export type EventGroupKey = keyof typeof EVENT_TYPE_GROUPS;
export type HistorialEventType = typeof EVENT_TYPE_GROUPS[EventGroupKey][number];

export const ALLOWED_EVENT_TYPES: readonly HistorialEventType[] =
  Object.values(EVENT_TYPE_GROUPS).flat() as HistorialEventType[];


export function normalizarTipoEvento(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase();
}

export function esTipoEventoPermitido(s: string | undefined | null): boolean {
  const norm = normalizarTipoEvento(s);
  return (ALLOWED_EVENT_TYPES as readonly string[]).includes(norm);
}

export function obtenerTiposDeEvento(): HistorialEventType[] {
  return [...ALLOWED_EVENT_TYPES];
}

function formatearEtiquetaTipoEvento(id: string) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// estructura para la UI (categorías y sus tipos, actualizar si se agregan mas)
export function obtenerGruposTiposEventoParaUI(): Array<{
  key: EventGroupKey;
  label: string;
  items: { value: HistorialEventType; label: string }[];
}> {
  const labels: Record<EventGroupKey, string> = {
    salud_veterinario: 'Salud y veterinario',
    higiene_estetica: 'Higiene y estética',
    actividad: 'Actividad',
    alimentacion: 'Alimentación',
    otros: 'Otros',
  };
  return (Object.keys(EVENT_TYPE_GROUPS) as EventGroupKey[]).map(key => ({
    key,
    label: labels[key],
    items: EVENT_TYPE_GROUPS[key].map(v => ({ value: v, label: formatearEtiquetaTipoEvento(v) })),
  }));
}

