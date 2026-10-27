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
    { id: 'oaj', nombre: 'Órgano de Administración Judicial (OAJ)', siglas: 'OAJ' },
    { id: 'tdj', nombre: 'Tribunal de Disciplina Judicial (TDJ)', siglas: 'TDJ' },
    { id: 'otro', nombre: 'Otro', admiteTextoLibre: true },
  ],
  generos: [
    { id: 'mujer', nombre: 'Mujer' },
    { id: 'hombre', nombre: 'Hombre' },
  ],
  gradosAcademicos: [
    { id: 'licenciatura', nombre: 'Licenciatura', femenino: 'Licenciada', masculino: 'Licenciado', abreviaturaFemenino: 'Lic.', abreviaturaMasculino: 'Lic.' },
    { id: 'maestria', nombre: 'Maestría', femenino: 'Maestra', masculino: 'Maestro', abreviaturaFemenino: 'Mtra.', abreviaturaMasculino: 'Mtro.' },
    { id: 'doctorado', nombre: 'Doctorado', femenino: 'Doctora', masculino: 'Doctor', abreviaturaFemenino: 'Dra.', abreviaturaMasculino: 'Dr.' },
  ],
};
