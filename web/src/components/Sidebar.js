import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardCheck,
  faUsers,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";
import logo from "../assets/logo.svg";

const Sidebar = ({ seccionActiva, setSeccionActiva, abierto, setAbierto }) => {
  const itemsMenu = [
    { id: "overview", etiqueta: "Overview", icono: faChartLine },
    { id: "asistencias", etiqueta: "Asistencias", icono: faClipboardCheck },
    { id: "alumnos", etiqueta: "Alumnos", icono: faUsers },
    { id: "reportes", etiqueta: "Reportes", icono: faFileAlt },
  ];

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
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <span className="user-name">Admin</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
