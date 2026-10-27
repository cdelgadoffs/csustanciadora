import { useEffect, useRef, useState } from 'react';
import Card from '../base/Card.jsx';
import IndicadorSync from '../base/IndicadorSync.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import BotonAgregar from '../base/BotonAgregar.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { estiloArchivo } from '../../utils/archivos.js';
import { archivosAutomaticos } from '../../utils/arbolArchivos.js';
import { puntosNumerados, puntoCoincide, nombreRemitente, numeroConPunto } from '../../utils/puntos.js';
import { partesConFormato } from '../../utils/textoFormato.js';
import TextoConFormato from '../base/TextoConFormato.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/ListaPuntosProyecto.css';

function seleccionarSiNoEsControl(e, seleccionar) {
  if (e.target.closest('button, a, input, label')) return;
  seleccionar();
}

function TarjetaPunto({ punto, titulo, requiereAcuerdo, nombreRemitente, opciones, archivos, onAbrir, seleccionada, onSeleccionar }) {
  const esInforme = !requiereAcuerdo;
  return (
    <div id={`punto-${punto.id}`} className={'widget-lista-puntos-item' + (seleccionada ? ' widget-lista-puntos-item-seleccionado' : '')}>
      <Card onClick={(e) => seleccionarSiNoEsControl(e, onSeleccionar)}>
        <div className="widget-lista-puntos-header">
          <span className={'widget-lista-puntos-titulo' + (punto.confidencial ? ' widget-lista-puntos-titulo-confidencial' : '') + (punto.relevante ? ' widget-lista-puntos-titulo-relevante' : '')}>
            {titulo}
          </span>
          <div className="widget-lista-puntos-header-derecha">
            <IndicadorSync estado={punto.sincronizacion} />
            {nombreRemitente && <span className="widget-lista-puntos-dependencia">{nombreRemitente}</span>}
            {opciones && (
              <div className="widget-lista-puntos-opciones">
                <div className="widget-lista-puntos-opciones-interior">{opciones}</div>
              </div>
            )}
          </div>
        </div>
        {!esInforme && (
          <div className="widget-lista-puntos-fila">
            <span className="widget-lista-puntos-label">Acuerdo</span>
            <div className="widget-lista-puntos-acuerdo">{punto.acuerdo || 'Sin acuerdo'}</div>
          </div>
        )}
        {archivos.length > 0 && (
          <div className="widget-lista-puntos-archivos">
            {archivos.map((a, i) => {
              const { icono, tono } = estiloArchivo(a.nombre);
              return (
                <BadgeDinamico
                  key={a.id ?? i}
                  texto={a.nombre}
                  icono={icono}
                  tono={tono}
                  onClick={a.id ? () => onAbrir(a) : undefined}
                />
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function listaDePuntos({ puntos, secciones, remitentes, estadoCarga, renderOpciones, onAbrir, sesion, seleccionadoId, seleccionar, termino, onAgregarAlFinal }) {
  if (puntos.length === 0) {
    if (estadoCarga === 'error') return null;
    if (estadoCarga === 'cargando') return <div className="widget-lista-puntos-vacio">Cargando…</div>;
    return <div className="widget-lista-puntos-vacio">Sin asuntos registrados.</div>;
  }
  const seccionDe = (p) => secciones.find((s) => s.id === p.seccion);
  const registradosDe = (seccionId) => puntos.filter((p) => !p.fijo && p.seccion === seccionId);
  const sinAsuntos = puntos.every((p) => p.fijo || seccionDe(p)?.alFinal) && estadoCarga === 'listo' && (
    <div key="vacio" className="widget-lista-puntos-vacio">Sin asuntos registrados.</div>
  );
  const numeros = new Map(puntosNumerados(puntos).map(({ punto, numero, titulo }) => [
    punto.id,
    punto.contenidoFormato
      ? <>{numeroConPunto(numero)} <TextoConFormato parrafos={partesConFormato(punto.contenidoFormato)} /></>
      : titulo,
  ]));
  const visibles = termino ? puntos.filter((p) => !p.encabezado && puntoCoincide(p, termino)) : puntos;
  if (termino && visibles.length === 0) {
    return <div className="widget-lista-puntos-vacio">Sin coincidencias para «{termino}».</div>;
  }
  const elementos = visibles.map((p) => {
    if (p.encabezado) {
      return (
        <div key={p.id} className="widget-lista-puntos-encabezado">
          <span>{numeros.get(p.id)}</span>
          {onAgregarAlFinal && (
            <span>
              <BotonAgregar onClick={onAgregarAlFinal}>+</BotonAgregar>
            </span>
          )}
        </div>
      );
    }
    const seccion = seccionDe(p);
    const grupo = p.fijo ? [] : registradosDe(p.seccion);
    return (
      <TarjetaPunto
        key={p.id}
        punto={p}
        titulo={numeros.get(p.id)}
        requiereAcuerdo={seccion ? seccion.requiereAcuerdo : false}
        nombreRemitente={nombreRemitente(p, remitentes, { corto: true })}
        opciones={p.fijo ? null : renderOpciones(p, grupo.indexOf(p), grupo, seccion)}
        archivos={[...archivosAutomaticos(p, sesion), ...(p.archivos || [])]}
        onAbrir={onAbrir}
        seleccionada={seleccionadoId === p.id}
        onSeleccionar={() => seleccionar(p.id)}
      />
    );
  });
  const indiceCierre = visibles.findIndex((p) => p.encabezado);
  if (sinAsuntos && !termino) elementos.splice(indiceCierre === -1 ? elementos.length : indiceCierre, 0, sinAsuntos);
  return elementos;
}

export default function ListaPuntosProyecto({ opcionesOcultas = [], opcionesExtra }) {
  const { PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, sesionSeleccionada, sesionFinalizada, listaCerrada, reordenarPuntos, cargando, error } = useProyecto();
  const puntos = PUNTOS.filter((p) => !p.agregadoEnSesion);
  const [errorAccion, setErrorAccion] = useState(null);
  const [moviendo, setMoviendo] = useState(false);
  const { terminoBusqueda, puntoDestinoProyecto, abrirVistaArchivo, abrirNuevoPunto } = useUI();
  const [seleccionadoId, setSeleccionadoId] = useState(puntoDestinoProyecto);
  const destinoDesplazado = useRef(null);
  const seleccionar = setSeleccionadoId;

  useEffect(() => {
    if (!puntoDestinoProyecto || destinoDesplazado.current === puntoDestinoProyecto) return;
    const tarjeta = document.getElementById(`punto-${puntoDestinoProyecto}`);
    if (!tarjeta) return;
    destinoDesplazado.current = puntoDestinoProyecto;
    tarjeta.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [puntoDestinoProyecto, PUNTOS]);
  const estadoCarga = error ? 'error' : cargando ? 'cargando' : 'listo';
  const avisoError = (error || errorAccion) && (
    <div className="widget-lista-puntos-error">
      {error ? `No se pudo cargar la información: ${error.mensaje}` : errorAccion}
    </div>
  );
  async function mover(seccionId, deLaSeccion, indice, delta) {
    if (moviendo) return;
    const ids = PUNTOS.filter((p) => !p.fijo && p.seccion === seccionId).map((p) => p.id);
    const a = ids.indexOf(deLaSeccion[indice].id);
    const b = ids.indexOf(deLaSeccion[indice + delta].id);
    [ids[a], ids[b]] = [ids[b], ids[a]];
    setMoviendo(true);
    setErrorAccion(null);
    try {
      await reordenarPuntos(seccionId, ids);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo mover el punto.');
    } finally {
      setMoviendo(false);
    }
  }
  const termino = terminoBusqueda.trim();
  const renderOpciones = (punto, indice, deLaSeccion, seccion) => {
    if (sesionFinalizada) return null;
    const ocultas = [
      ...opcionesOcultas,
      ...(listaCerrada && !seccion?.admiteConListaCerrada ? ['mover', 'editar', 'eliminar'] : []),
      ...(termino ? ['mover'] : []),
    ];
    const seccionId = seccion?.id;
    return (
      <>
        {deLaSeccion.length > 1 && !ocultas.includes('mover') && (
          <OpcionesNavegacion
            orientacion="vertical"
            onAnterior={() => mover(seccionId, deLaSeccion, indice, -1)}
            onSiguiente={() => mover(seccionId, deLaSeccion, indice, 1)}
            anteriorDeshabilitado={moviendo || indice === 0}
            siguienteDeshabilitado={moviendo || indice === deLaSeccion.length - 1}
            etiquetaAnterior="Subir punto"
            etiquetaSiguiente="Bajar punto"
          />
        )}
        <OpcionesAUD punto={punto} ocultar={ocultas}>
          {opcionesExtra && opcionesExtra(punto)}
        </OpcionesAUD>
      </>
    );
  };

  const seccionAlFinal = SECCIONES_DOCUMENTO.find((sec) => sec.alFinal);
  const onAgregarAlFinal = seccionAlFinal && !sesionFinalizada && !termino && sesionSeleccionada
    ? () => abrirNuevoPunto(seccionAlFinal.id)
    : null;

  return (
    <div className="widget-lista-puntos-proyecto">
      {avisoError}
      {SECCIONES_DOCUMENTO.length > 0 ? listaDePuntos({
        puntos, secciones: SECCIONES_DOCUMENTO, remitentes: REMITENTES, estadoCarga, renderOpciones,
        onAbrir: abrirVistaArchivo, sesion: sesionSeleccionada, seleccionadoId, seleccionar, termino, onAgregarAlFinal,
      }) : (
        estadoCarga === 'listo' && <div className="widget-lista-puntos-vacio">Sin secciones definidas.</div>
      )}
      {SECCIONES_DOCUMENTO.length === 0 && estadoCarga === 'cargando' && <div className="widget-lista-puntos-vacio">Cargando…</div>}
    </div>
  );
}
