import Topbar from '../components/widgets/Topbar.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/MenuPanelControl.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../utils/sesiones.js';
import '../styles/pages/Historial.css';

export default function Historial() {
  const {
    izquierdaSidebar1, izquierdaSidebar3,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
  } = useUI();
  const { sesionSeleccionada } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const panelIzquierda = izquierdaSidebar3;

  return (
    <>
      <Topbar />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
      >
        <MenuPrincipalSesion />
      </Sidebar1>
      <Sidebar5
        abierto={sidebar5Abierto}
        ancho={sidebar5Ancho}
        accionesHeader={<AccionesHeaderPanelControl />}
        onCerrar={cerrarSidebar5}
      >
        <MenuPanelControl />
      </Sidebar5>
      <PanelPrincipal izquierda={panelIzquierda}>
        <div className="pg-historial">
          <h1 className="pg-historial-titulo">Historial</h1>
          <p className="pg-historial-texto">Aún no hay actas generadas.</p>
        </div>
      </PanelPrincipal>
    </>
  );
}
