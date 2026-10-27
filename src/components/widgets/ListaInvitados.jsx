import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { tituloInvitado } from '../../utils/invitados.js';
import '../../styles/widgets/ListaInvitados.css';

export default function ListaInvitados() {
  const { sesionSeleccionada, sesionFinalizada, INVITADOS, GRADOS_ACADEMICOS } = useProyecto();
  const { invitadoEnEdicionId, abrirEdicionInvitado } = useUI();

  if (!sesionSeleccionada) return null;

  return (
    <div className="widget-lista-invitados">
      <div className="widget-lista-invitados-titulo">
        Invitados{INVITADOS.length > 0 ? ` (${INVITADOS.length})` : ''}
      </div>
      {INVITADOS.length === 0 && <div className="widget-lista-invitados-vacio">Sin invitados registrados.</div>}
      {INVITADOS.map((i) => {
        const activo = i.id === invitadoEnEdicionId;
        return (
          <div key={i.id} className={i.genero === 'mujer' ? 'widget-lista-invitados-mujer' : undefined}>
          <BotonSeleccionableMenu
            activo={activo}
            onClick={sesionFinalizada ? undefined : () => abrirEdicionInvitado(i.id)}
          >
            <span className="widget-lista-invitados-nombre">{i.nombre}</span>
            {activo && <span className="widget-lista-invitados-grado">{tituloInvitado(i, GRADOS_ACADEMICOS)}</span>}
          </BotonSeleccionableMenu>
          </div>
        );
      })}
    </div>
  );
}
