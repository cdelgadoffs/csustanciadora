import Topbar from '../components/widgets/Topbar.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar3 from '../components/base/Sidebar3.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import BotonCerrarLista from '../components/widgets/BotonCerrarLista.jsx';
import BotonDescargar from '../components/widgets/BotonDescargar.jsx';
import FormularioPunto from '../components/widgets/FormularioPunto.jsx';
import ListaPuntosProyecto from '../components/widgets/ListaPuntosProyecto.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/MenuPanelControl.jsx';
import { useUI, ANCHO_SIDEBAR3, ALTO_TOPBAR, ALTO_CINTA } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../utils/sesiones.js';
import '../styles/pages/ProyectoOrdenDia.css';

export default function ProyectoOrdenDia() {
  const {
    izquierdaSidebar1, izquierdaSidebar3,
    sidebar3Abierto, cerrarSidebar3, puntoEnEdicionId,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
  } = useUI();
  const { sesionSeleccionada, sesionFinalizada, listaCerrada } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const panelIzquierda = izquierdaSidebar3 + (sidebar3Abierto ? ANCHO_SIDEBAR3 : 0);
  const arriba = ALTO_TOPBAR + ALTO_CINTA;
  const arribaSidebar = arriba - 1;

  return (
    <>
      <Topbar />
      <CintaSesiones textoVacio="Aún no hay sesiones programadas." />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        arriba={arribaSidebar}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
        pie={sesionSeleccionada && !sesionFinalizada && !sidebar3Abierto ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <BotonCerrarLista />
            {listaCerrada && <BotonDescargar />}
          </div>
        ) : null}
      >
        <MenuPrincipalSesion />
      </Sidebar1>
      <Sidebar3
        abierto={sidebar3Abierto}
        izquierda={izquierdaSidebar3}
        arriba={arribaSidebar}
        badge={puntoEnEdicionId ? 'Editar asunto' : 'Nuevo asunto'}
        onCerrar={cerrarSidebar3}
      >
        <FormularioPunto />
      </Sidebar3>
      <Sidebar5
        abierto={sidebar5Abierto}
        ancho={sidebar5Ancho}
        accionesHeader={<AccionesHeaderPanelControl />}
        onCerrar={cerrarSidebar5}
      >
        <MenuPanelControl />
      </Sidebar5>
      <PanelPrincipal izquierda={panelIzquierda} arriba={arriba}>
        <ListaPuntosProyecto />
      </PanelPrincipal>
    </>
  );
}
