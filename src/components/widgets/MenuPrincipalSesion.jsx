import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import BotonAgregar from '../base/BotonAgregar.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { contarPuntos, puntoCoincide } from '../../utils/puntos.js';
import '../../styles/widgets/MenuPrincipalSesion.css';

const VISTAS_MENU_PRINCIPAL = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'proyecto', label: 'Proyecto del orden del día', agregarPunto: true, mostrarTotalPuntos: true },
  { id: 'sesion', label: 'Elaboración de acta', requiereListaCerrada: true },
  { id: 'historial', label: 'Historial' },
];

export default function MenuPrincipalSesion() {
  const { PUNTOS, listaCerrada } = useProyecto();
  const { vistaActual, setVistaActual, abrirNuevoPunto, terminoBusqueda } = useUI();

  function agregarPunto() {
    abrirNuevoPunto();
  }

  return (
    <div className="widget-menu-principal-sesion">
      {VISTAS_MENU_PRINCIPAL.map((v) => {
        const activo = vistaActual === v.id;
        return (
          <BotonSeleccionableMenu
            key={v.id}
            activo={activo}
            deshabilitado={v.requiereListaCerrada && !listaCerrada && !activo}
            badge={v.mostrarTotalPuntos ? contarPuntos(PUNTOS.filter((p) => !p.agregadoEnSesion && puntoCoincide(p, terminoBusqueda))) : undefined}
            accion={v.agregarPunto && activo && !listaCerrada && (
              <BotonAgregar onClick={agregarPunto}>+</BotonAgregar>
            )}
            onClick={() => setVistaActual(v.id)}
          >
            {v.label}
          </BotonSeleccionableMenu>
        );
      })}
    </div>
  );
}
