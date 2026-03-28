import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import config from "../config/api.config";
import { apiGet } from "../config/api.config";

const AuthContext = createContext(null);

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
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      iniciarPolling(storedToken);
    }
    setLoading(false);

    return () => detenerPolling();
  }, [iniciarPolling, detenerPolling]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.mensaje || "Error al iniciar sesión");
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
      return { ok: false, error: error.message };
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
