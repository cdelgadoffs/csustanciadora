import { useEffect, useRef, useState } from 'react';
import ListaExpandible from '../base/ListaExpandible.jsx';
import Textarea from '../base/Textarea.jsx';
import Checkbox from '../base/Checkbox.jsx';
import CampoTexto from '../base/CampoTexto.jsx';
import BotonS from '../base/BotonS.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import { estiloArchivo, guardarEnDisco } from '../../utils/archivos.js';
import '../../styles/widgets/FormularioPunto.css';

function estadoVacio(seccion) {
  return {
    seccion: seccion || '',
    remitente: '',
    remitenteOtro: '',
    contenido: '',
    acuerdo: '',
    confidencial: false,
    archivos: [],
  };
}

function claveBorrador(seccion) {
  return `formularioPunto:${seccion}`;
}

function tieneContenido(f) {
  return f.contenido.trim().length > 0 || f.acuerdo.trim().length > 0 || f.confidencial;
}

export default function FormularioPunto() {
  const { SECCIONES_DOCUMENTO, REMITENTES, PUNTOS, agregarPunto, editarPunto, eliminarArchivo, descargarArchivo, guardarBorrador, obtenerBorrador, eliminarBorrador, error: errorCarga } = useProyecto();
  const { sidebar3Abierto, cerrarSidebar3, puntoEnEdicionId, seccionNuevoPunto, nuevoPuntoEnSesion } = useUI();
  const seccionUnica = seccionNuevoPunto || SECCIONES_DOCUMENTO[0]?.id || '';
  const [form, setForm] = useState(() => estadoVacio(seccionUnica));
  const [restaurado, setRestaurado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [archivoAQuitar, setArchivoAQuitar] = useState(null);
  const [errorQuitar, setErrorQuitar] = useState(null);
  const claveGuardadaRef = useRef(null);
  const asuntoRef = useRef(null);
  const remitenteOtroRef = useRef(null);
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  const punto = puntoEnEdicionId ? PUNTOS.find((p) => p.id === puntoEnEdicionId) : null;
  const editando = !!punto;

  useEffect(() => {
    if (puntoEnEdicionId && !punto) cerrarSidebar3();
  }, [puntoEnEdicionId, punto]);

  useEffect(() => {
    if (sidebar3Abierto) asuntoRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
  }, [sidebar3Abierto, puntoEnEdicionId, seccionUnica]);

  useEffect(() => {
    if (!sidebar3Abierto) return;
    setRestaurado(false);
    setError(null);
    if (puntoEnEdicionId) {
      const original = PUNTOS.find((p) => p.id === puntoEnEdicionId);
      if (original) {
        setForm({
          seccion: original.seccion,
          remitente: original.remitente,
          remitenteOtro: original.remitenteOtro ?? '',
          contenido: original.contenido,
          acuerdo: original.acuerdo,
          confidencial: original.confidencial,
          archivos: original.archivos,
        });
      }
      return;
    }
    let vigente = true;
    const seccion = seccionUnica;
    setForm(estadoVacio(seccion));
    obtenerBorrador(claveBorrador(seccion))
      .catch(() => null)
      .then((borrador) => {
        if (!vigente) return;
        claveGuardadaRef.current = borrador ? claveBorrador(seccion) : null;
        if (borrador) setForm({ ...estadoVacio(seccion), ...borrador, seccion });
        setRestaurado(true);
      });
    return () => { vigente = false; };
  }, [sidebar3Abierto, seccionUnica, puntoEnEdicionId]);

  useEffect(() => {
    if (!restaurado) return;
    const clave = claveBorrador(form.seccion);
    const temporizador = setTimeout(() => {
      const anterior = claveGuardadaRef.current;
      if (anterior && anterior !== clave) eliminarBorrador(anterior);
      if (tieneContenido(form)) {
        guardarBorrador(clave, { ...form, archivos: [] });
        claveGuardadaRef.current = clave;
      } else {
        eliminarBorrador(clave);
        claveGuardadaRef.current = null;
      }
    }, 300);
    return () => clearTimeout(temporizador);
  }, [form, restaurado]);

  const seccionActual = SECCIONES_DOCUMENTO.find((s) => s.id === form.seccion);
  const esInforme = seccionActual ? !seccionActual.requiereAcuerdo : false;
  const remitenteActual = REMITENTES.some((r) => r.id === form.remitente) ? form.remitente : (REMITENTES[0]?.id || '');
  const remitenteLibre = !!REMITENTES.find((r) => r.id === remitenteActual)?.admiteTextoLibre;

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function adjuntarArchivos(e) {
    const nuevos = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, archivos: [...f.archivos, ...nuevos] }));
    e.target.value = '';
  }

  function quitarArchivoPendiente(indice) {
    setForm((f) => ({ ...f, archivos: f.archivos.filter((_, i) => i !== indice) }));
  }

  async function descargar(archivo) {
    setError(null);
    try {
      const { nombre, blob } = await descargarArchivo(archivo.id);
      guardarEnDisco(nombre, blob);
    } catch (e) {
      setError(e.mensaje || 'No se pudo descargar el archivo.');
    }
  }

  function cancelarQuitar() {
    setArchivoAQuitar(null);
    setErrorQuitar(null);
  }

  async function quitarArchivo() {
    setErrorQuitar(null);
    try {
      await eliminarArchivo(punto.id, archivoAQuitar.id);
      setArchivoAQuitar(null);
    } catch (e) {
      setErrorQuitar(e.mensaje || 'No se pudo quitar el archivo.');
    }
  }

  function cancelar() {
    cerrarSidebar3();
  }

  function borrar() {
    setForm(estadoVacio(form.seccion));
  }

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      const datos = {
        seccion: form.seccion,
        remitente: remitenteActual,
        remitenteOtro: remitenteLibre ? form.remitenteOtro.trim() : '',
        contenido: form.contenido.trim(),
        acuerdo: esInforme ? '' : form.acuerdo.trim(),
        confidencial: form.confidencial,
      };
      if (editando) {
        await editarPunto(punto.id, punto.version, datos);
        cerrarSidebar3();
      } else {
        await agregarPunto({ ...datos, archivos: form.archivos, ...(nuevoPuntoEnSesion ? { agregadoEnSesion: true } : null) });
        setForm(estadoVacio(form.seccion));
      }
    } catch (e) {
      setError(e.mensaje || (editando ? 'No se pudo guardar el punto.' : 'No se pudo añadir el punto.'));
    } finally {
      setEnviando(false);
    }
  }

  const puedeConfirmar = !enviando && !!seccionActual && !!remitenteActual && (!remitenteLibre || form.remitenteOtro.trim().length > 0) && form.contenido.trim().length > 0 && (esInforme || form.acuerdo.trim().length > 0);

  return (
    <div className="widget-formulario-punto-wrap">
      <div className="widget-formulario-punto" ref={contenedorRef} onScroll={onScroll}>
      <div className="widget-formulario-punto-fila">
        <div className="widget-formulario-punto-campo widget-formulario-punto-remitente">
          <label className="widget-formulario-punto-label">Remitente</label>
          <ListaExpandible
            valorActual={remitenteActual}
            etiquetaActual={(() => {
              const r = REMITENTES.find((x) => x.id === remitenteActual);
              return r ? (r.siglas ?? r.nombre) : '';
            })()}
            opciones={REMITENTES.map((r) => ({ id: r.id, label: r.nombre }))}
            onSeleccionar={(id) => {
              actualizar('remitente', id);
              if (REMITENTES.find((r) => r.id === id)?.admiteTextoLibre) {
                requestAnimationFrame(() => remitenteOtroRef.current?.querySelector('input')?.focus());
              }
            }}
          />
        </div>

      {(!editando || punto.archivos.length > 0) && (
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">{editando ? 'Archivos' : 'Adjuntar archivos'}</label>
          {!editando && (
            <input type="file" className="widget-formulario-punto-archivo-input" multiple onChange={adjuntarArchivos} />
          )}
          {(editando ? punto.archivos : form.archivos).length > 0 && (
            <div className="widget-formulario-punto-archivos">
              {editando
                ? punto.archivos.map((a, i) => {
                    const { icono, tono } = estiloArchivo(a.nombre);
                    return (
                      <BadgeDinamico
                        key={a.id ?? i}
                        texto={a.nombre}
                        icono={icono}
                        tono={tono}
                        onClick={a.id ? () => descargar(a) : undefined}
                        onEliminar={a.id ? () => setArchivoAQuitar(a) : undefined}
                      />
                    );
                  })
                : form.archivos.map((a, i) => {
                    const { icono, tono } = estiloArchivo(a.name);
                    return (
                      <BadgeDinamico
                        key={`${a.name}-${i}`}
                        texto={a.name}
                        icono={icono}
                        tono={tono}
                        onEliminar={() => quitarArchivoPendiente(i)}
                      />
                    );
                  })}
            </div>
          )}
        </div>
      )}
      </div>

      {remitenteLibre && (
        <div className="widget-formulario-punto-campo" ref={remitenteOtroRef}>
          <CampoTexto
            value={form.remitenteOtro}
            onChange={(v) => actualizar('remitenteOtro', v)}
            placeholder="Escribe el remitente"
          />
        </div>
      )}

      <div className="widget-formulario-punto-campo" ref={asuntoRef}>
        <label className="widget-formulario-punto-label">{esInforme ? 'Asunto' : 'Punto de acuerdo'}</label>
        <Textarea
          value={form.contenido}
          onChange={(v) => actualizar('contenido', v)}
          placeholder={esInforme ? 'Asunto' : '...por el que/cual se...'}
        />
      </div>

      {!esInforme && (
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">Acuerdo</label>
          <Textarea value={form.acuerdo} onChange={(v) => actualizar('acuerdo', v)} placeholder="Acuerdos" />
        </div>
      )}

      <Checkbox
        checked={form.confidencial}
        onChange={(v) => actualizar('confidencial', v)}
        label="Marcar como confidencial"
      />

      {(error || errorCarga) && (
        <div className="widget-formulario-punto-error">
          {error || `No se pudo cargar la información: ${errorCarga.mensaje}`}
        </div>
      )}

      <div className="widget-formulario-punto-acciones">
        {editando ? <span></span> : <BotonIcono icono="ri-eraser-line" ariaLabel="Borrar formulario" onClick={borrar} />}
        <div className="widget-formulario-punto-acciones-grupo">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={confirmar} disabled={!puedeConfirmar}>{editando ? 'Guardar' : 'Añadir'}</BotonS>
        </div>
      </div>
      </div>
      <Modal abierto={!!archivoAQuitar} titulo="Quitar archivo" onCerrar={cancelarQuitar}>
        <p className="widget-formulario-punto-modal-mensaje">
          ¿Quieres quitar «{archivoAQuitar?.nombre}» de este punto? Esta acción no se puede deshacer.
        </p>
        {errorQuitar && <div className="widget-formulario-punto-error">{errorQuitar}</div>}
        <div className="widget-formulario-punto-modal-acciones">
          <BotonS variant="claro" onClick={cancelarQuitar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={quitarArchivo}>Quitar</BotonS>
        </div>
      </Modal>
      {thumb.visible && (
        <div
          className="widget-formulario-punto-scrollbar-thumb"
          style={{ height: thumb.alto, top: thumb.top }}
          onMouseDown={onArrastrarThumb}
        />
      )}
    </div>
  );
}
