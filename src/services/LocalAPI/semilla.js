export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'asuntos', nombre: 'Asunto', requiereAcuerdo: false },
    { id: 'asuntos-generales', nombre: 'Asunto general', requiereAcuerdo: false, admiteConListaCerrada: true, alFinal: true },
  ],
  puntosFijos: [
    { id: 'orden-dia', texto: 'Orden del día', posicion: 'inicio', condicion: 'siempre', encabezado: false },
    { id: 'acta-anterior', texto: 'Aprobación de actas', posicion: 'inicio', condicion: 'actasPendientes', encabezado: false },
    { id: 'asuntos-generales', texto: 'Asuntos Generales', posicion: 'final', condicion: 'siempre', encabezado: true },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'presidencia', nombre: 'Presidencia' },
    { id: 'secretaria-general', nombre: 'Secretaría General' },
  ],
};
