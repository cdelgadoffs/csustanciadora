import Topbar from '../components/widgets/Topbar.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar4 from '../components/base/Sidebar4.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import VistaNavegador from '../components/widgets/VistaNavegador.jsx';
import VisorArchivo from '../components/widgets/VisorArchivo.jsx';
import InfoElementoNavegador from '../components/widgets/InfoElementoNavegador.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/MenuPanelControl.jsx';
import { useUI, ALTO_TOPBAR, ALTO_CINTA, ANCHO_SIDEBAR4 } from '../context/UIContext.jsx';
import { useAjustesVisuales } from '../context/AjustesVisualesContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../utils/sesiones.js';

export default function Inicio() {
  const {
    izquierdaSidebar1, izquierdaSidebar3,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
  } = useUI();
  const { sesionSeleccionada } = useProyecto();
  const { infoNavegadorAbierta, cambiarAjuste } = useAjustesVisuales();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const panelIzquierda = izquierdaSidebar3;
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
      <VisorArchivo />
      <Sidebar4
        abierto={infoNavegadorAbierta}
        titulo="Información"
        arriba={arriba}
        derecha={0}
        onCerrar={() => cambiarAjuste('infoNavegadorAbierta', false)}
      >
        <InfoElementoNavegador />
      </Sidebar4>
      <PanelPrincipal izquierda={panelIzquierda} derecha={infoNavegadorAbierta ? ANCHO_SIDEBAR4 : 0} arriba={arriba}>
        <VistaNavegador />
      </PanelPrincipal>
    </>
  );
}
