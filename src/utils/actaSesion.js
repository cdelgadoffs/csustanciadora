import { MESES } from './meses.js';
import { puntosNumerados, textoPunto, fechasAgrupadas } from './puntos.js';
import { ordinalFemenino } from './numerosOrdinales.js';
import { fechaEnLetras, horaEnLetras } from './numerosEnLetras.js';

const ANCHO_HOJA = 12240;
const ALTO_HOJA = 15840;
const MARGEN = 1418;
const NOMBRE_ORGANO = 'Junta de Coordinación';
const MARCA = '[asistentes]';
const FIRMANTE = '[Nombre y cargo]';
const SIN_DELIBERACION = 'Sin deliberación registrada.';
const LUGAR = 'en el aula de cristal del Órgano de Administración Judicial del edificio sede planta baja, ubicada en Avenida Revolución 1508, Colonia Guadalupe Inn, Demarcación Territorial Álvaro Obregón, C.P. 01020';
const FUNDAMENTO = 'en términos de lo dispuesto por los artículos 101 y 153 de la Ley Orgánica del Poder Judicial de la Federación, así como del artículo 3 del Acuerdo General Conjunto del Pleno del Órgano de Administración Judicial y del Pleno del Tribunal de Disciplina Judicial de la Federación, por el que se determinan las disposiciones de organización y funcionamiento de la Junta de Coordinación';

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function reunion(sesion) {
  const anio = sesion.id.slice(0, 4);
  return sesion.numeroSesion ? `${capitalizar(ordinalFemenino(sesion.numeroSesion))} Reunión ${anio}` : `Reunión ${anio}`;
}

function fechaCorta(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${anio}`;
}

function conPunto(texto) {
  return /[.!?]$/.test(texto) ? texto : `${texto}.`;
}

function textoActasAprobadas(punto, sesion) {
  const actas = punto.actas || [];
  const { dias, anio } = fechasAgrupadas(actas.map((a) => a.fecha));
  const cuando = anio ? `${dias} ${anio === sesion.id.slice(0, 4) ? 'del presente año' : `de ${anio}`}` : dias;
  return actas.length === 1
    ? `El acta de la reunión de ${cuando} fue aprobada por unanimidad de los integrantes de la ${NOMBRE_ORGANO}.`
    : `Las actas de las reuniones de ${cuando} fueron aprobadas por unanimidad de los integrantes de la ${NOMBRE_ORGANO}.`;
}

function cuerpoPunto(punto, sesion, puntos) {
  if (punto.encabezado) return [];
  if (punto.fijo && punto.clave === 'orden-dia') {
    if (!punto.tratado) return [SIN_DELIBERACION];
    const asuntos = puntos.filter((p) => !p.fijo).length;
    return [`Se aprobó en sus términos con ${asuntos} ${asuntos === 1 ? 'asunto' : 'asuntos'} y asuntos generales.`];
  }
  if (punto.fijo && punto.actas?.length) return [punto.tratado ? textoActasAprobadas(punto, sesion) : SIN_DELIBERACION];
  const parrafos = (punto.deliberacion || '').split(/\n+/).map((t) => t.trim()).filter(Boolean);
  return parrafos.length ? parrafos : [SIN_DELIBERACION];
}

export function nombreArchivoActa(sesion) {
  return `Acta - ${reunion(sesion).toUpperCase()}.docx`;
}

export async function generarWordActa({ sesion, puntos }) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber, TabStopType,
  } = await import('docx');

  const corrida = (text, extra = {}) => new TextRun({ text, size: 24, font: 'Arial', color: '000000', ...extra });
  const parrafo = (children, extra = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 }, children, ...extra });

  const horaInicio = horaEnLetras(sesion.horaProgramada) ?? '[hora]';
  const horaFin = horaEnLetras(sesion.horaTermino) ?? '[hora]';
  const fecha = fechaEnLetras(sesion.id);

  const titulo = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [corrida(`ACTA DE LA ${reunion(sesion).toUpperCase()} DE LA ${NOMBRE_ORGANO.toUpperCase()}, CELEBRADA EL ${fecha.toUpperCase()}.`, { font: 'Times New Roman', size: 28, color: '2E74B5' })],
  });

  const apertura = parrafo([corrida(
    `En la Ciudad de México, siendo ${horaInicio} del ${fecha}, ${MARCA}, integrantes de la ${NOMBRE_ORGANO}, se reunieron ${LUGAR}, para celebrar la ${reunion(sesion)} de la ${NOMBRE_ORGANO}, ${FUNDAMENTO}.`,
  )], { indent: { firstLine: 567 } });

  const introduccion = parrafo([corrida('Los asuntos y temas a tratar conforme al Orden del Día, se hacen constar a continuación:')]);

  const cuerpo = puntosNumerados(puntos).flatMap(({ punto, numero }) => [
    new Paragraph({
      spacing: { before: 240, after: 160, line: 300 },
      indent: { left: 567, hanging: 567 },
      tabStops: [{ type: TabStopType.LEFT, position: 567 }],
      children: [corrida(`${numero}.\t${conPunto(punto.confidencial ? 'CONFIDENCIAL' : textoPunto(punto))}`, { bold: true })],
    }),
    ...cuerpoPunto(punto, sesion, puntos).map((texto) => parrafo([corrida(texto)])),
  ]);

  const cierre = parrafo([corrida(
    `No habiendo más asuntos que tratar, se dio por concluida la ${reunion(sesion)} de la ${NOMBRE_ORGANO}, siendo ${horaFin} del día de su fecha, firmando al calce quienes en ella intervinieron.`,
  )], { spacing: { before: 240, after: 200, line: 360 } });

  const firma = (primera) => [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: primera ? 1200 : 1000 }, children: [corrida('______________________________________')] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [corrida(FIRMANTE, { bold: true, size: 20 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [corrida(`Integrante de la ${NOMBRE_ORGANO}`, { size: 20 })] }),
  ];

  const encabezado = new Header({
    children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [corrida(`${NOMBRE_ORGANO}.`, { font: 'Times New Roman', size: 18 })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [corrida(`${fechaCorta(sesion.id)}.`, { font: 'Times New Roman', size: 18 })] }),
    ],
  });
  const pie = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial' })] })],
  });

  const documento = new Document({
    sections: [{
      properties: {
        titlePage: true,
        page: {
          size: { width: ANCHO_HOJA, height: ALTO_HOJA },
          margin: { top: MARGEN, left: MARGEN, bottom: MARGEN, right: MARGEN },
        },
      },
      headers: { default: encabezado, first: new Header({ children: [] }) },
      footers: { default: pie, first: pie },
      children: [titulo, apertura, introduccion, ...cuerpo, cierre, ...firma(true), ...firma(false)],
    }],
  });

  return { blob: await Packer.toBlob(documento), nombreArchivo: nombreArchivoActa(sesion) };
}
