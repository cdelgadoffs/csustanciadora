import { MESES } from './meses.js';
import { puntosNumerados, textoPunto } from './puntos.js';
import { ordinalFemenino } from './numerosOrdinales.js';

const MARGEN = 1134;
const ANCHO_HOJA = 11906;
const ALTO_HOJA = 16838;
const ANCHO_UTIL = ALTO_HOJA - MARGEN * 2;
const ANCHO_NUMERO = 1300;
const FONDO_ENCABEZADO = 'D9D9D9';
const NOMBRE_ORGANO = 'JUNTA DE COORDINACIÓN';

function tituloReunion(sesion) {
  return sesion.numeroSesion ? `${ordinalFemenino(sesion.numeroSesion)} reunión`.toUpperCase() : 'REUNIÓN';
}

function fechaDelTitulo(sesion) {
  const fecha = new Date(sesion.id + 'T00:00:00');
  return `${fecha.getDate()} DE ${MESES[fecha.getMonth()].toUpperCase()} DE ${fecha.getFullYear()}`;
}

function horaDoce(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export function nombreArchivoOrdenDia(sesion) {
  return `Orden del dia - ${tituloReunion(sesion)}.docx`;
}

export async function generarWordOrdenDia({ sesion, puntos }) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, VerticalAlign, PageOrientation,
  } = await import('docx');

  const corrida = (text, extra = {}) => new TextRun({ text, size: 20, color: '000000', font: 'Arial', ...extra });
  const raya = '__________';
  const datos = [
    ['Hora de inicio', horaDoce(sesion.horaProgramada) ?? raya],
    ['Hora de término', horaDoce(sesion.horaTermino) ?? raya],
    ['Número de asuntos', String(puntos.length)],
    ['Asuntos agregados', raya],
  ];

  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde };
  const mitad = ANCHO_UTIL / 2;
  const encabezado = new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: [mitad, mitad],
    borders: sinBordes,
    rows: datos.map(([etiqueta, valor], i) => new TableRow({
      children: [
        new TableCell({
          width: { size: mitad, type: WidthType.DXA },
          borders: sinBordes,
          children: [new Paragraph({ children: [corrida(`${etiqueta}: `, { bold: true }), corrida(valor, { bold: true })] })],
        }),
        new TableCell({
          width: { size: mitad, type: WidthType.DXA },
          borders: sinBordes,
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: i === 1 ? [corrida(NOMBRE_ORGANO, { bold: true })] : [] })],
        }),
      ],
    })),
  });

  const titulo = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 160 },
    children: [corrida(`ORDEN DEL DÍA DE LA ${tituloReunion(sesion)} DE ${fechaDelTitulo(sesion)}`, { bold: true, size: 22 })],
  });

  const celda = (texto, { ancho, negrita = false, centrado = false, fondo } = {}) => new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    ...(fondo ? { shading: { type: ShadingType.CLEAR, color: 'auto', fill: fondo } } : null),
    children: [new Paragraph({
      alignment: centrado ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [corrida(texto, { bold: negrita })],
    })],
  });

  const filas = [
    new TableRow({
      tableHeader: true,
      children: [
        celda('Número', { ancho: ANCHO_NUMERO, negrita: true, centrado: true, fondo: FONDO_ENCABEZADO }),
        celda('Punto de Acuerdo', { ancho: ANCHO_UTIL - ANCHO_NUMERO, negrita: true, centrado: true, fondo: FONDO_ENCABEZADO }),
      ],
    }),
    ...puntosNumerados(puntos).map(({ punto, numero }) => new TableRow({
      children: [
        celda(String(numero), { ancho: ANCHO_NUMERO, negrita: true, centrado: true }),
        celda(punto.confidencial ? 'CONFIDENCIAL' : textoPunto(punto), { ancho: ANCHO_UTIL - ANCHO_NUMERO, negrita: punto.encabezado }),
      ],
    })),
  ];

  const tabla = new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: [ANCHO_NUMERO, ANCHO_UTIL - ANCHO_NUMERO],
    rows: filas,
  });

  const documento = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: ANCHO_HOJA, height: ALTO_HOJA, orientation: PageOrientation.LANDSCAPE },
          margin: { top: MARGEN, left: MARGEN, bottom: MARGEN, right: MARGEN },
        },
      },
      children: [encabezado, titulo, tabla],
    }],
  });

  return { blob: await Packer.toBlob(documento), nombreArchivo: nombreArchivoOrdenDia(sesion) };
}
