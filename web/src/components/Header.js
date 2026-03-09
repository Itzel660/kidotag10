import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import "./Header.css";

const Header = ({ seccionActiva, setSeccionActiva, onMenuToggle }) => {
  const obtenerTituloSeccion = () => {
    switch (seccionActiva) {
      case "overview":
        return "Dashboard";
      case "asistencias":
        return "Asistencias";
      case "alumnos":
        return "Gestión de Alumnos";
      case "reportes":
        return "Reportes";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1 className="page-title">{obtenerTituloSeccion()}</h1>
      </div>
      <div className="header-actions">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input type="text" placeholder="Buscar..." />
        </div>
        <button
          className="btn-primary"
          onClick={() => setSeccionActiva("alumnos")}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nuevo Alumno</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
