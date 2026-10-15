export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'asuntos', nombre: 'Asunto', requiereAcuerdo: false },
  ],
  puntosFijos: [
    { id: 'orden-dia', texto: 'Aprobación, en su caso, del orden del día.', posicion: 'inicio', condicion: 'siempre', encabezado: false },
    { id: 'acta-anterior', texto: 'Aprobación, en su caso, del acta de la sesión del {fecha}.', posicion: 'inicio', condicion: 'sesionAnteriorCelebrada', encabezado: false },
    { id: 'asuntos-generales', texto: 'Asuntos generales.', posicion: 'final', condicion: 'siempre', encabezado: true },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'presidencia', nombre: 'Presidencia' },
    { id: 'secretaria-general', nombre: 'Secretaría General' },
  ],
};
