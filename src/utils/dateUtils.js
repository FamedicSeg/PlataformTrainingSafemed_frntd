/**
 * Utilidades para manejar fechas de manera robusta
 * Resuelve problemas de parseo de fechas ISO-8601 y formato local
 */

/**
 * Parsea una string de fecha de forma segura
 * Maneja formatos ISO-8601, locales y timestamps
 * El backend envía instantes ISO con zona (UTC), por lo que no se aplica ningún ajuste manual.
 * @param {string|Date|number} dateStr - String de fecha, objeto Date o timestamp
 * @returns {Date|null} - Objeto Date válido o null si es inválido
 */
export const parseFecha = (dateStr) => {
  if (!dateStr) return null;

  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);

  if (isNaN(date.getTime())) {
    console.warn(`⚠️ Fecha inválida: "${dateStr}"`);
    return null;
  }

  return date;
};

/**
 * Convierte una fecha a formato "YYYY-MM-DDTHH:mm" en hora local (para inputs datetime-local)
 * @param {string|Date|number} dateStr
 * @returns {string} - Valor para el input o string vacío si es inválida
 */
export const aInputLocal = (dateStr) => {
  const date = parseFecha(dateStr);
  if (!date) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

/**
 * Compara si una fecha de fin ha expirado
 * @param {string|Date} fechaFin - Fecha de fin del curso
 * @returns {boolean} - True si el curso ha expirado
 */
export const esCursoExpiradoSeguro = (fechaFin) => {
  if (!fechaFin) return false;
  
  const fechaFinDate = parseFecha(fechaFin);
  if (!fechaFinDate) return false;
  
  const ahora = new Date();
  return ahora > fechaFinDate;
};

/**
 * Compara si una fecha de inicio aún no ha llegado
 * @param {string|Date} fechaInicio - Fecha de inicio del curso
 * @returns {boolean} - True si el curso es próximo (aún no ha iniciado)
 */
export const esCursoProximoSeguro = (fechaInicio) => {
  if (!fechaInicio) return false;
  
  const fechaInicioDate = parseFecha(fechaInicio);
  if (!fechaInicioDate) return false;
  
  const ahora = new Date();
  return ahora < fechaInicioDate;
};

/**
 * Formatea una fecha para mostrarla al usuario en formato es-EC
 * @param {string|Date} dateStr - String de fecha o objeto Date
 * @param {boolean} conHora - Si incluir hora en el formato (default: true)
 * @returns {string} - Fecha formateada o string vacío si es inválida
 */
export const formatearFecha = (dateStr, conHora = true) => {
  const date = parseFecha(dateStr);
  if (!date) return '';
  
  const opciones = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(conHora && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleString('es-EC', opciones);
};

/**
 * Obtiene los días/horas/minutos restantes hasta una fecha
 * @param {string|Date} fechaFin - Fecha límite
 * @returns {Object|null} - {días, horas, minutos} o null si es inválido o ya pasó
 */
export const tiempoRestante = (fechaFin) => {
  const fechaFinDate = parseFecha(fechaFin);
  if (!fechaFinDate) return null;
  
  const ahora = new Date();
  const diferencia = fechaFinDate.getTime() - ahora.getTime();
  
  if (diferencia < 0) return null; // Ya expiró
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  
  return { dias, horas, minutos };
};

export default {
  parseFecha,
  aInputLocal,
  esCursoExpiradoSeguro,
  esCursoProximoSeguro,
  formatearFecha,
  tiempoRestante
};
