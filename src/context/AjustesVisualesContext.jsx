import { createContext, useContext, useState } from 'react';
import { leerAjustesVisuales, guardarAjustesVisuales } from '../services/AjustesVisuales.js';
import { NIVELES_BRILLO } from '../utils/brillo.js';

const AjustesVisualesContext = createContext(null);

export function AjustesVisualesProvider({ children }) {
  const [ajustes, setAjustes] = useState(leerAjustesVisuales);

  function cambiarAjuste(clave, valor) {
    guardarAjustesVisuales({ [clave]: valor });
    setAjustes((a) => ({ ...a, [clave]: valor }));
  }

  const value = {
    brilloPantalla: NIVELES_BRILLO.includes(ajustes.brilloPantalla) ? ajustes.brilloPantalla : 0,
    infoNavegadorAbierta: ajustes.infoNavegadorAbierta === true,
    cambiarAjuste,
  };
  return <AjustesVisualesContext.Provider value={value}>{children}</AjustesVisualesContext.Provider>;
}

export function useAjustesVisuales() {
  return useContext(AjustesVisualesContext);
}
