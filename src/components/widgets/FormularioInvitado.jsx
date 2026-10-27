import { useEffect, useRef, useState } from 'react';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import Checkbox from '../base/Checkbox.jsx';
import CampoTexto from '../base/CampoTexto.jsx';
import BotonAgregar from '../base/BotonAgregar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { tituloInvitado, tratamientoInvitado } from '../../utils/invitados.js';
import '../../styles/widgets/FormularioInvitado.css';

const ESTILO_GENERO = {
  mujer: { icono: 'ri-women-line', tono: 'morado' },
  hombre: { icono: 'ri-men-line', tono: 'azul' },
};

export default function FormularioInvitado() {
  const { sesionSeleccionada, sesionFinalizada, GENEROS, GRADOS_ACADEMICOS, INVITADOS, agregarInvitado, editarInvitado, eliminarInvitado } = useProyecto();
  const { sidebar3Abierto, invitadoEnEdicionId, setInvitadoEnEdicionId } = useUI();
  const [genero, setGenero] = useState(null);
  const [grado, setGrado] = useState(null);
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [agregadosAhora, setAgregadosAhora] = useState([]);
  const [aQuitar, setAQuitar] = useState(null);
  const [errorQuitar, setErrorQuitar] = useState(null);
  const nombreRef = useRef(null);
  const enEdicion = INVITADOS.find((i) => i.id === invitadoEnEdicionId) ?? null;

  function enfocarNombre() {
    nombreRef.current?.querySelector('input')?.focus();
  }

  useEffect(() => {
    if (!sidebar3Abierto) setAgregadosAhora([]);
  }, [sidebar3Abierto]);

  useEffect(() => {
    setAgregadosAhora([]);
  }, [sesionSeleccionada?.id]);

  useEffect(() => {
    setError(null);
    if (invitadoEnEdicionId && !enEdicion) {
      setInvitadoEnEdicionId(null);
      return;
    }
    setGenero(enEdicion?.genero ?? null);
    setGrado(enEdicion?.grado ?? null);
    setNombre(enEdicion?.nombre ?? '');
    if (enEdicion) enfocarNombre();
  }, [invitadoEnEdicionId, !!enEdicion]);

  if (!sesionSeleccionada || sesionFinalizada || GENEROS.length === 0) return null;

  const generoActual = GENEROS.find((g) => g.id === genero) ?? GENEROS[0];
  const estilo = ESTILO_GENERO[generoActual.id] ?? { tono: 'gris' };
  const recientes = INVITADOS.filter((i) => agregadosAhora.includes(i.id));

  function alternarGenero() {
    const i = GENEROS.indexOf(generoActual);
    setGenero(GENEROS[(i + 1) % GENEROS.length].id);
    enfocarNombre();
  }

  async function guardar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const datos = { nombre, genero: generoActual.id, grado };
      if (enEdicion) {
        await editarInvitado(enEdicion.id, datos);
        setInvitadoEnEdicionId(null);
      } else {
        const anteriores = new Set(INVITADOS.map((i) => i.id));
        const sesion = await agregarInvitado(datos);
        const nuevos = (sesion?.invitados ?? []).filter((i) => !anteriores.has(i.id)).map((i) => i.id);
        setAgregadosAhora((ids) => [...ids, ...nuevos]);
        setNombre('');
        setGrado(null);
      }
    } catch (e) {
      setError(e.mensaje || (enEdicion ? 'No se pudo guardar al invitado.' : 'No se pudo agregar al invitado.'));
    } finally {
      setEnviando(false);
    }
  }

  function cancelarQuitar() {
    setAQuitar(null);
    setErrorQuitar(null);
  }

  async function quitar() {
    setErrorQuitar(null);
    try {
      await eliminarInvitado(aQuitar.id);
      if (aQuitar.id === invitadoEnEdicionId) setInvitadoEnEdicionId(null);
      setAQuitar(null);
    } catch (e) {
      setErrorQuitar(e.mensaje || 'No se pudo quitar al invitado.');
    }
  }

  return (
    <div className="widget-formulario-invitado">
      <div className="widget-formulario-invitado-encabezado">
        <span className="widget-formulario-invitado-label">{enEdicion ? 'Editar invitado' : 'Invitados'}</span>
        <BadgeDinamico
          texto={generoActual.nombre}
          icono={estilo.icono}
          tono={estilo.tono}
          title="Cambiar género"
          onClick={alternarGenero}
        />
      </div>
      <div className="widget-formulario-invitado-grados">
        {GRADOS_ACADEMICOS.map((g) => (
          <Checkbox
            key={g.id}
            label={g.nombre}
            checked={grado === g.id}
            onChange={(marcado) => {
              setGrado(marcado ? g.id : null);
              enfocarNombre();
            }}
          />
        ))}
      </div>
      <div className="widget-formulario-invitado-nombre" ref={nombreRef}>
        <CampoTexto value={nombre} onChange={setNombre} onEnter={guardar} placeholder="Nombre del invitado" />
        {!enEdicion && <BotonAgregar onClick={guardar}>+</BotonAgregar>}
      </div>
      {enEdicion && (
        <div className="widget-formulario-invitado-acciones">
          <span className="widget-formulario-invitado-eliminar">
            <BotonIcono icono="ri-delete-bin-line" ariaLabel="Eliminar invitado" onClick={() => setAQuitar(enEdicion)} />
          </span>
          <div className="widget-formulario-invitado-acciones-grupo">
            <BotonS variant="claro" onClick={() => setInvitadoEnEdicionId(null)}>Cancelar</BotonS>
            <BotonS variant="claro" onClick={guardar} disabled={enviando}>Guardar</BotonS>
          </div>
        </div>
      )}
      {error && <div className="widget-formulario-invitado-error">{error}</div>}
      {recientes.length > 0 && (
        <div className="widget-formulario-invitado-recientes">
          {recientes.map((i) => (
            <span key={i.id} className={'widget-formulario-invitado-item' + (i.id === invitadoEnEdicionId ? ' widget-formulario-invitado-item-editando' : '')}>
              <BadgeDinamico
                texto={<><strong>{tituloInvitado(i, GRADOS_ACADEMICOS)}</strong> {i.nombre}</>}
                title={tratamientoInvitado(i, GRADOS_ACADEMICOS)}
                icono={ESTILO_GENERO[i.genero]?.icono}
                tono={ESTILO_GENERO[i.genero]?.tono ?? 'gris'}
                onEditar={() => setInvitadoEnEdicionId(i.id)}
                onEliminar={() => setAQuitar(i)}
              />
            </span>
          ))}
        </div>
      )}
      <Modal abierto={!!aQuitar} titulo="Quitar invitado" onCerrar={cancelarQuitar}>
        <p className="widget-formulario-invitado-mensaje">
          ¿Quieres quitar a «{aQuitar && tratamientoInvitado(aQuitar, GRADOS_ACADEMICOS)}» de los invitados de esta sesión?
        </p>
        {errorQuitar && <div className="widget-formulario-invitado-error">{errorQuitar}</div>}
        <div className="widget-formulario-invitado-modal-acciones">
          <BotonS variant="claro" onClick={cancelarQuitar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={quitar}>Quitar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
