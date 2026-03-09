/**
 * Configuración de la API
 * 
 * Este archivo centraliza todas las URLs y configuraciones del API
 */

// Leer variables de entorno (deben empezar con REACT_APP_)
const config = {
  // URL base del API REST
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  
  // URL para WebSocket (Socket.IO)
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
  
  // Timeout para peticiones HTTP (en milisegundos)
  timeout: 30000,
  
  // Headers comunes para todas las peticiones
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Obtener URL completa de un endpoint
 * @param {string} endpoint - Endpoint sin slash inicial (ej: 'alumnos')
 * @returns {string} URL completa
 */
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
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

/**
 * Realizar petición GET al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiGet = async (endpoint, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: 'GET',
    headers: getAuthHeaders(token),
    signal: AbortSignal.timeout(config.timeout),
  });
  
  return response.json();
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
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(config.timeout),
  });
  
  return response.json();
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
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(config.timeout),
  });
  
  return response.json();
};

/**
 * Realizar petición DELETE al API
 * @param {string} endpoint - Endpoint a consultar
 * @param {string} token - Token JWT (opcional)
 * @returns {Promise} Respuesta del API
 */
export const apiDelete = async (endpoint, token = null) => {
  const response = await fetch(getApiUrl(endpoint), {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    signal: AbortSignal.timeout(config.timeout),
  });
  
  return response.json();
};

export default config;
