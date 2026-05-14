import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import config from "../config/api.config";
import { apiGet, readApiResponse } from "../config/api.config";

const AuthContext = createContext(null);

const getLoginErrorMessage = ({ response, data, error } = {}) => {
  if (response) {
    if (response.status === 401) {
      return "Email o contraseña incorrectos";
    }

    if (response.status === 400) {
      return data?.error?.mensaje || "Email y contraseña son requeridos";
    }

    if (response.status === 403) {
      return data?.error?.mensaje || "La cuenta está inactiva";
    }

    if (response.status >= 500) {
      return "Ocurrio un error del servidor. Intenta nuevamente más tarde";
    }

    if (data?.error?.codigo === "RESPUESTA_INVALIDA") {
      return "No se pudo procesar la respuesta del servidor. Intenta nuevamente";
    }

    return data?.error?.mensaje || "Ocurrio un error al iniciar sesión";
  }

  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    return "El servidor tardó demasiado en responder. Intenta nuevamente";
  }

  if (error instanceof TypeError) {
    return "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente";
  }

  return error?.message || "Ocurrio un error al iniciar sesión";
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const pollingRef = useRef(null);

  // Polling de mensajes no leídos cada 6 segundos
  const iniciarPolling = useCallback((authToken) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const verificarMensajes = async () => {
      try {
        const data = await apiGet("mensajes/no-leidos", authToken);
        if (data.ok) {
          setMensajesNoLeidos(data.data.count);
        }
      } catch (error) {
        // Silenciar errores de polling
      }
    };

    verificarMensajes();
    pollingRef.current = setInterval(verificarMensajes, 6000);
  }, []);

  const detenerPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cargar sesión del localStorage al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser && typeof parsedUser === "object") {
          setToken(storedToken);
          setUser(parsedUser);
          iniciarPolling(storedToken);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.warn(
          "Sesion almacenada invalida, limpiando localStorage",
          error,
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);

    return () => detenerPolling();
  }, [iniciarPolling, detenerPolling]);

  const login = async (email, password) => {
    try {
      const normalizedEmail = email.trim();
      const normalizedPassword = password.trim();

      if (!normalizedEmail || !normalizedPassword) {
        return {
          ok: false,
          error: "Email y contraseña son requeridos",
        };
      }

      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(config.timeout),
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data?.ok) {
        return {
          ok: false,
          error: getLoginErrorMessage({ response, data }),
        };
      }

      if (data.ok && data.data) {
        const { token: authToken, tipo, usuario } = data.data;
        const userData = { ...usuario, tipo };

        setToken(authToken);
        setUser(userData);

        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));

        iniciarPolling(authToken);

        return { ok: true };
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
    } catch (error) {
      console.error("Error en login:", error);
      return {
        ok: false,
        error: getLoginErrorMessage({ error }),
      };
    }
  };

  const logout = () => {
    detenerPolling();
    setUser(null);
    setToken(null);
    setMensajesNoLeidos(0);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    mensajesNoLeidos,
    setMensajesNoLeidos,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
