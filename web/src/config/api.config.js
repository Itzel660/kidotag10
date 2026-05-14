/**
 * Configuración de la API
 *
 * Este archivo centraliza todas las URLs y configuraciones del API
 */

// Leer variables de entorno de Vite (deben empezar con VITE_)
const config = {
  // URL base del API REST
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",

  // URL para WebSocket (Socket.IO)
  socketUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",

  // Timeout para peticiones HTTP (en milisegundos)
  timeout: 30000,

  // Headers comunes para todas las peticiones
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

/**
 * Obtener URL completa de un endpoint
 * @param {string} endpoint - Endpoint sin slash inicial (ej: 'alumnos')
 * @returns {string} URL completa
 */
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${config.apiUrl}/${cleanEndpoint}`;
};

/**
 * Obtener headers con token de autenticación
 * @param {string} token - Token JWT (opcional)
 * @returns {object} Headers configurados
 */
export const getAuthHeaders = (token = null) => {
  const headers = { ...config.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const buildInvalidResponse = (response, mensaje) => ({
  ok: false,
  error: {
    codigo: "RESPUESTA_INVALIDA",
    mensaje,
    detalle: `HTTP ${response.status} ${response.statusText}`.trim(),
  },
});

export const readApiResponse = async (response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    if (response.status === 204 || response.status === 205) {
      return { ok: response.ok, data: null };
    }

    return buildInvalidResponse(
      response,
      "El servidor devolvio una respuesta vacia",
    );
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    return buildInvalidResponse(
      response,
      "El servidor devolvio una respuesta invalida",
    );
  }
};

/**
 * Realizar petición GET al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiGet = async (endpoint, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: "GET",
    headers: getAuthHeaders(token),
    signal: AbortSignal.timeout(config.timeout),
  });

  return readApiResponse(response);
};

const getDownloadFilename = (response, fallbackName = "archivo") => {
  const header = response.headers.get("content-disposition") || "";
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fallbackMatch = header.match(/filename="?([^";]+)"?/i);
  if (fallbackMatch?.[1]) {
    return fallbackMatch[1];
  }

  return fallbackName;
};

export const apiDownload = async (
  endpoint,
  token = null,
  fallbackName = "archivo",
) => {
  const headers = getAuthHeaders(token);
  delete headers["Content-Type"];
  headers.Accept = "*/*";

  const response = await fetch(getApiUrl(endpoint), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(config.timeout),
  });

  if (!response.ok) {
    const data = await readApiResponse(response);
    throw new Error(data?.error?.mensaje || "No se pudo descargar el archivo");
  }

  const blob = await response.blob();

  return {
    ok: true,
    data: {
      blob,
      fileName: getDownloadFilename(response, fallbackName),
    },
  };
};

/**
 * Realizar petición POST al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {object} data - Datos a enviar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiPost = async (endpoint, data, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(config.timeout),
  });

  return readApiResponse(response);
};

/**
 * Realizar petición PUT al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {object} data - Datos a enviar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiPut = async (endpoint, data, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(config.timeout),
  });

  return readApiResponse(response);
};

/**
 * Realizar petición DELETE al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiDelete = async (endpoint, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: "DELETE",
    headers: getAuthHeaders(token),
    signal: AbortSignal.timeout(config.timeout),
  });

  return readApiResponse(response);
};

export default config;
