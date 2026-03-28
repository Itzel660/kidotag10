import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardCheck,
  faUsers,
  faFileAlt,
  faSignOutAlt,
  faEnvelope,
  faUserTie,
  faUserFriends,
  faChild,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";
import logo from "../assets/logo.svg";

const Sidebar = ({ seccionActiva, setSeccionActiva, abierto, setAbierto }) => {
  const { user, logout, mensajesNoLeidos } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const esProfesor = user?.tipo === "profesor";
  const esAdmin = user?.tipo === "profesor" && user?.esAdmin;
  const esTutor = user?.tipo === "tutor";

  const getItemsMenu = () => {
    const items = [
      { id: "overview", etiqueta: "Overview", icono: faChartLine },
    ];

    if (esTutor) {
      items.push({ id: "mis-hijos", etiqueta: "Mis Hijos", icono: faChild });
    }

    if (esProfesor) {
      items.push({
        id: "asistencias",
        etiqueta: "Asistencias",
        icono: faClipboardCheck,
      });
      items.push({ id: "alumnos", etiqueta: "Alumnos", icono: faUsers });
    }

    items.push({
      id: "mensajes",
      etiqueta: "Mensajes",
      icono: faEnvelope,
      badge: mensajesNoLeidos > 0 ? mensajesNoLeidos : null,
    });

    if (esAdmin) {
      items.push({
        id: "profesores",
        etiqueta: "Profesores",
        icono: faUserTie,
      });
      items.push({ id: "tutores", etiqueta: "Tutores", icono: faUserFriends });
    }

    if (esProfesor) {
      items.push({ id: "reportes", etiqueta: "Reportes", icono: faFileAlt });
    }

    return items;
  };

  const itemsMenu = getItemsMenu();

  const getRoleLabel = () => {
    if (esAdmin) return "Administrador";
    if (esProfesor) return "Profesor";
    return "Tutor";
  };

  return (
    <aside className={`sidebar ${abierto ? "active" : ""}`}>
      <div className="logo-container">
        <img src={logo} alt="Kidotag" className="logo" />
        <h2>KIDOTAG</h2>
      </div>

      <nav className="nav-menu">
        {itemsMenu.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${seccionActiva === item.id ? "active" : ""}`}
            onClick={() => setSeccionActiva(item.id)}
          >
            <FontAwesomeIcon icon={item.icono} className="nav-icon" />
            <span>{item.etiqueta}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.nombre || "Usuario"}</span>
            <span className="user-role">{getRoleLabel()}</span>
          </div>
        </div>
        <button
          className="btn-logout"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
