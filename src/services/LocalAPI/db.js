import { ApiError } from '../ApiError.js';
import { CATALOGOS_SEMILLA } from './semilla.js';

const DB_NAME = 'LocalAPI';
const DB_VERSION = 13;

export const STORE_SESIONES = 'sesiones';
export const STORE_PUNTOS = 'puntos';
export const STORE_CATALOGOS = 'catalogos';
export const STORE_ARCHIVOS = 'archivos';

function asignarOrden(store) {
  store.getAll().onsuccess = (evento) => {
    const grupos = new Map();
    evento.target.result.forEach((p) => {
      const clave = `${p.sesionId}|${p.seccion}`;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(p);
    });
    grupos.forEach((lista) => {
      lista
        .sort((a, b) => (a.creadoEn === b.creadoEn ? (a.id < b.id ? -1 : 1) : (a.creadoEn < b.creadoEn ? -1 : 1)))
        .forEach((p, i) => store.put({ ...p, orden: i + 1 }));
    });
  };
}

const ORDEN_SECCIONES_ANTERIORES = ['informes', 'dictamenes', 'acuerdos', 'asuntos generales'];

function unificarSecciones(store) {
  store.getAll().onsuccess = (evento) => {
    const secciones = CATALOGOS_SEMILLA.secciones;
    const porSesion = new Map();
    evento.target.result.forEach((p) => {
      if (!porSesion.has(p.sesionId)) porSesion.set(p.sesionId, []);
      porSesion.get(p.sesionId).push(p);
    });
    porSesion.forEach((lista) => {
      lista
        .sort((a, b) => (a.seccion === b.seccion
          ? (a.orden || 0) - (b.orden || 0)
          : ORDEN_SECCIONES_ANTERIORES.indexOf(a.seccion) - ORDEN_SECCIONES_ANTERIORES.indexOf(b.seccion)))
        .forEach((p, i) => store.put({ ...p, seccion: secciones[0].id, orden: i + 1 }));
    });
  };
}

let conexion = null;

function abrirDB() {
  if (!conexion) {
    conexion = conectar().catch((e) => {
      conexion = null;
      throw e;
    });
  }
  return conexion;
}

function conectar() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    let bloqueada = false;
    req.onblocked = () => {
      bloqueada = true;
      reject(new ApiError('NO_DISPONIBLE', 'Hay otra pestaña de la aplicación con una versión anterior abierta. Ciérrala o recárgala e intenta de nuevo.'));
    };
    req.onupgradeneeded = (evento) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESIONES)) {
        db.createObjectStore(STORE_SESIONES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PUNTOS)) {
        db.createObjectStore(STORE_PUNTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ARCHIVOS)) {
        db.createObjectStore(STORE_ARCHIVOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATALOGOS)) {
        const store = db.createObjectStore(STORE_CATALOGOS, { keyPath: 'nombre' });
        Object.entries(CATALOGOS_SEMILLA).forEach(([nombre, items]) => store.put({ nombre, items }));
      }
      if (evento.oldVersion < 5) asignarOrden(req.transaction.objectStore(STORE_PUNTOS));
      if (evento.oldVersion < 6 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
        unificarSecciones(req.transaction.objectStore(STORE_PUNTOS));
      }
      if (evento.oldVersion < 9 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'puntosFijos', items: CATALOGOS_SEMILLA.puntosFijos });
      }
      if (evento.oldVersion < 10 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
      }
      if (evento.oldVersion < 11 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'generos', items: CATALOGOS_SEMILLA.generos });
      }
      if (evento.oldVersion < 12 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'gradosAcademicos', items: CATALOGOS_SEMILLA.gradosAcademicos });
      }
      if (evento.oldVersion < 13 && evento.oldVersion > 0) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'remitentes', items: CATALOGOS_SEMILLA.remitentes });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      if (bloqueada) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        conexion = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

async function pedir(store, modo, operacion) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, modo);
    const req = operacion(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function obtenerTodos(store) {
  return pedir(store, 'readonly', (s) => s.getAll()).then((r) => r || []);
}

export function obtener(store, id) {
  return pedir(store, 'readonly', (s) => s.get(id));
}

export function guardar(store, valor) {
  return pedir(store, 'readwrite', (s) => s.put(valor));
}

export async function escribirVarios({ poner = [], borrar = [] }) {
  if (poner.length === 0 && borrar.length === 0) return;
  const db = await abrirDB();
  const stores = [...new Set([...poner.map((e) => e.store), ...borrar.map((e) => e.store)])];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    poner.forEach(({ store, valor }) => tx.objectStore(store).put(valor));
    borrar.forEach(({ store, id }) => tx.objectStore(store).delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
