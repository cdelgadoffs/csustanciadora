import logoTdj from '../assets/tdj.jpg?inline';
import logoOaj from '../assets/oaj2.jpg?inline';
import { MESES } from './meses.js';
import { puntosNumerados, partesPunto, enumerar, numeroConPunto } from './puntos.js';
import { ordinalFemenino } from './numerosOrdinales.js';
import { fechaEnLetras, horaEnLetras } from './numerosEnLetras.js';
import { tratamientoInvitado } from './invitados.js';

const ANCHO_HOJA = 12240;
const ALTO_HOJA = 19293;
const MARGENES = { top: 2705, right: 1701, bottom: 851, left: 1985, header: 1701, footer: 618 };
const SANGRIA = 180;
const NOMBRE_ORGANO = 'Junta de Coordinación';
const SIN_INTEGRANTES = '[integrantes]';
const SIN_DELIBERACION = 'Sin deliberación registrada.';
const APROBADO = 'Se aprobó en sus términos.';
const LUGAR = 'en el aula del Órgano de Administración Judicial del edificio sede planta baja, ubicada en Avenida Revolución 1508, Colonia Guadalupe Inn, Demarcación Territorial Álvaro Obregón, C.P. 01020';
const FUNDAMENTO = 'en términos de lo dispuesto por los artículos 101 y 153 de la Ley Orgánica del Poder Judicial de la Federación';

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function reunion(sesion) {
  const anio = sesion.id.slice(0, 4);
  return sesion.numeroSesion ? `${capitalizar(ordinalFemenino(sesion.numeroSesion))} Reunión ${anio}` : `Reunión ${anio}`;
}

function reunionTitulo(sesion) {
  return sesion.numeroSesion ? `${ordinalFemenino(sesion.numeroSesion)} reunión`.toUpperCase() : 'REUNIÓN';
}

function fechaEncabezado(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${String(dia).padStart(2, '0')} de ${MESES[mes - 1].toLowerCase()} de ${anio}.`;
}

function articulo(persona) {
  return persona.genero === 'mujer' ? 'la' : 'el';
}

function textoIntegrantes(integrantes) {
  if (!integrantes.length) return SIN_INTEGRANTES;
  return enumerar(integrantes.map((i) => `${articulo(i)} ${i.tratamiento} ${i.nombre}, ${i.cargo}`));
}

function textoAcompanantes(invitados, grados) {
  if (!invitados.length) return '';
  const nombres = invitados.map((i) => {
    const tratamiento = tratamientoInvitado(i, grados);
    return `${articulo(i)} ${tratamiento.charAt(0).toLowerCase()}${tratamiento.slice(1)}`;
  });
  return `, acompañados por ${enumerar(nombres)}`;
}

function conPuntoFinal(partes) {
  const lineas = partes.map((l) => l.map((p) => ({ ...p })));
  const ultima = lineas[lineas.length - 1];
  const parte = ultima[ultima.length - 1];
  if (parte && !/[.!?]\s*$/.test(parte.texto)) parte.texto = `${parte.texto.trimEnd()}.`;
  return lineas;
}

function deliberacion(punto) {
  return (punto.deliberacion || '').split(/\n+/).map((t) => t.trim()).filter(Boolean);
}

function cuerpoPunto(punto) {
  if (punto.encabezado) return [];
  if (punto.fijo) return [punto.tratado ? APROBADO : SIN_DELIBERACION];
  const parrafos = deliberacion(punto);
  return parrafos.length ? parrafos : [SIN_DELIBERACION];
}

export function nombreArchivoActa(sesion) {
  return `Acta - ${reunion(sesion).toUpperCase()}.docx`;
}

export async function generarWordActa({ sesion, puntos, integrantes = [], grados = [] }) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber, TabStopType,
    ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx');

  const corrida = (text, extra = {}) => new TextRun({ text, size: 24, font: 'Arial', color: '000000', ...extra });
  const parrafo = (children, extra = {}) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 0, line: 360 },
    children,
    ...extra,
  });
  const vacio = () => parrafo([]);
  const sangrado = (children) => parrafo(children, { indent: { left: SANGRIA } });

  const horaInicio = horaEnLetras(sesion.horaProgramada) ?? '[hora]';
  const horaFin = horaEnLetras(sesion.horaTermino) ?? '[hora]';
  const fecha = fechaEnLetras(sesion.id);

  const titulo = parrafo([corrida(
    `ACTA DE LA ${reunionTitulo(sesion)} DE LA ${NOMBRE_ORGANO.toUpperCase()}, CELEBRADA EL ${fecha.toUpperCase()}.`,
    { bold: true },
  )]);

  const apertura = parrafo([corrida(
    `En la Ciudad de México, siendo ${horaInicio} del ${fecha}, ${textoIntegrantes(integrantes)}, integrantes de la ${NOMBRE_ORGANO}${textoAcompanantes(sesion.invitados || [], grados)}; se reunieron ${LUGAR}, para llevar a cabo la ${reunion(sesion)} de la ${NOMBRE_ORGANO}, ${FUNDAMENTO}.`,
  )]);

  const introduccion = parrafo(
    [corrida('Los asuntos y temas tratados conforme al Orden del Día fueron los siguientes:')],
    { indent: { firstLine: 567 } },
  );

  const VINETA = 300;
  const NUMERO_SUB = 700;
  const conNumero = (numero, lineas, { base, inicio = 0, negrita = false }) => lineas.map((linea, i) => {
    const conVineta = linea[0]?.vineta;
    const texto = base + inicio;
    return parrafo([
      ...(i === 0 ? [corrida(`${numero}	`, { bold: true })] : []),
      ...linea.map((p) => corrida(p.vineta ? '•	' : p.texto, {
        bold: negrita || p.negrita,
        italics: p.cursiva,
        ...(p.subrayado ? { underline: {} } : null),
      })),
    ], i === 0 && !conVineta
      ? { indent: { left: texto, hanging: base }, tabStops: [{ type: TabStopType.LEFT, position: texto }] }
      : conVineta
        ? { indent: { left: texto + VINETA, hanging: i === 0 ? base + VINETA : VINETA }, tabStops: [{ type: TabStopType.LEFT, position: texto }, { type: TabStopType.LEFT, position: texto + VINETA }] }
        : { indent: { left: texto } });
  });

  const tituloPunto = (numero, punto) => conNumero(numeroConPunto(numero), conPuntoFinal(partesPunto(punto)), { base: SANGRIA * 2, negrita: true });

  const subpunto = (numero, punto) => {
    const parrafos = deliberacion(punto);
    const lineas = parrafos.length ? parrafos.map((t) => [{ texto: t }]) : conPuntoFinal(partesPunto(punto));
    return conNumero(`${numero}.`, lineas, { base: NUMERO_SUB, inicio: SANGRIA });
  };

  const cuerpo = puntosNumerados(puntos).flatMap(({ punto, numero }) => {
    if (String(numero).includes('.')) return [...subpunto(numero, punto), vacio()];
    return [
      ...tituloPunto(numero, punto),
      ...cuerpoPunto(punto).map((texto) => sangrado([corrida(texto)])),
      vacio(),
    ];
  });

  const cierre = sangrado([corrida(
    `Habiendo desahogado todos los puntos a tratar, se dio por concluida la reunión a ${horaFin} del día de su fecha, levantándose la presente acta que firman los integrantes de la ${NOMBRE_ORGANO}.`,
  )]);

  const firmantes = integrantes.length ? integrantes : [{ tratamiento: '', nombre: '[Nombre]', cargo: '[Cargo]' }];
  const firmas = firmantes.flatMap((i, k) => [
    new Paragraph({ spacing: { before: k === 0 ? 1200 : 1000 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [corrida(`${i.tratamiento} ${i.nombre}`.trim(), { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [corrida(`${i.cargo} e integrante de la ${NOMBRE_ORGANO}`)] }),
  ]);

  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde };
  const celdaLogo = (ancho, imagen, alineacion) => new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    borders: sinBordes,
    children: [new Paragraph({ alignment: alineacion, children: imagen ? [imagen] : [] })],
  });
  const logos = new Table({
    width: { size: 9073, type: WidthType.DXA },
    columnWidths: [3848, 405, 4820],
    indent: { size: -714, type: WidthType.DXA },
    borders: sinBordes,
    rows: [new TableRow({
      children: [
        celdaLogo(3848, new ImageRun({ data: logoTdj, transformation: { width: 195, height: 74 } }), AlignmentType.LEFT),
        celdaLogo(405, null, AlignmentType.RIGHT),
        celdaLogo(4820, new ImageRun({ data: logoOaj, transformation: { width: 218, height: 58 } }), AlignmentType.RIGHT),
      ],
    })],
  });
  const lineaEncabezado = (texto) => new Paragraph({ alignment: AlignmentType.RIGHT, children: [corrida(texto)] });
  const encabezado = new Header({
    children: [logos, lineaEncabezado(`${NOMBRE_ORGANO}.`), lineaEncabezado(fechaEncabezado(sesion.id))],
  });
  const pie = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 24, font: 'Arial' })] })],
  });

  const documento = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: ANCHO_HOJA, height: ALTO_HOJA },
          margin: MARGENES,
        },
      },
      headers: { default: encabezado },
      footers: { default: pie },
      children: [titulo, vacio(), apertura, vacio(), introduccion, vacio(), ...cuerpo, cierre, ...firmas],
    }],
  });

  return { blob: await Packer.toBlob(documento), nombreArchivo: nombreArchivoActa(sesion) };
}
