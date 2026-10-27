import { Fragment, useState } from 'react';
import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import Checkbox from '../base/Checkbox.jsx';
import BotonAgregar from '../base/BotonAgregar.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { puntosOrdenados, puntosNumerados, puntoActivo, etiquetaAsunto } from '../../utils/puntos.js';
import '../../styles/widgets/ListaPuntosSesion.css';

export default function ListaPuntosSesion() {
  const { PUNTOS, SECCIONES_DOCUMENTO, sesionFinalizada, marcarPunto, cargando, error } = useProyecto();  
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId, terminoBusqueda, abrirNuevoPunto } = useUI();
  const termino = terminoBusqueda.trim();
  const [errorAccion, setErrorAccion] = useState(null);
  const [guardandoId, setGuardandoId] = useState(null);

  async function marcar(id, tratado) {
    setPuntoSesionSeleccionadoId(id);
    setErrorAccion(null);
    setGuardandoId(id);
    try {
      await marcarPunto(id, tratado);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo guardar la marca del punto.');
    } finally {
      setGuardandoId(null);
    }
  }

  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO, termino);
  const activoId = puntoActivo(items, puntoSesionSeleccionadoId)?.punto.id;
  const tituloCierre = puntosNumerados(PUNTOS).find(({ punto }) => punto.encabezado)?.titulo;
  const primerSubpunto = items.find(({ numero }) => String(numero).includes('.'))?.punto.id;
  const seccionAlFinal = SECCIONES_DOCUMENTO.find((s) => s.alFinal);
  const separador = tituloCierre && (
    <div className="widget-lista-puntos-sesion-separador">
      <span>{tituloCierre}</span>
      {seccionAlFinal && !sesionFinalizada && (
        <BotonAgregar onClick={() => abrirNuevoPunto(seccionAlFinal.id, { agregadoEnSesion: true })}>+</BotonAgregar>
      )}
    </div>
  );

  const aviso = error ? `No se pudo cargar la información: ${error.mensaje}` : errorAccion;
  const vacio = items.length === 0
    ? (cargando ? 'Cargando…' : error ? null : termino ? `Sin coincidencias para «${termino}».` : 'Esta sesión no tiene puntos.')
    : null;

  return (
    <div className="widget-lista-puntos-sesion">
      <Scrollbar>
        <div className="widget-lista-puntos-sesion-contenido">
          {aviso && <div className="widget-lista-puntos-sesion-error">{aviso}</div>}
          {vacio && <div className="widget-lista-puntos-sesion-vacio">{vacio}</div>}
          {termino && items.length > 0 && (
            <div className="widget-lista-puntos-sesion-vacio">{items.length} {items.length === 1 ? 'coincidencia' : 'coincidencias'} para «{termino}»</div>
          )}
          {items.map(({ punto, numero }) => (
            <Fragment key={punto.id}>
              {punto.id === primerSubpunto && separador}
              <BotonSeleccionableMenu
                activo={punto.id === activoId}
                completado={!!punto.tratado}
                onClick={() => setPuntoSesionSeleccionadoId(punto.id)}
                accion={
                  <span className="widget-lista-puntos-sesion-accion" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!punto.tratado}
                      disabled={sesionFinalizada || guardandoId === punto.id}
                      onChange={(valor) => marcar(punto.id, valor)}
                    />
                  </span>
                }
              >
                {etiquetaAsunto(numero)}
              </BotonSeleccionableMenu>
            </Fragment>
          ))}
          {!primerSubpunto && !termino && items.length > 0 && separador}
        </div>
      </Scrollbar>
    </div>
  );
}
