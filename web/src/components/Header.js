import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

const Header = ({ seccionActiva, setSeccionActiva, onMenuToggle }) => {
  const { user } = useAuth();
  const esProfesor = user?.tipo === "profesor";

  const obtenerTituloSeccion = () => {
    switch (seccionActiva) {
      case "overview":
        return "Inicio";
      case "asistencias":
        return "Asistencias";
      case "alumnos":
        return "Gestión de Alumnos";
      case "reportes":
        return "Reportes";
      case "mensajes":
        return "Mensajes";
      case "profesores":
        return "Gestión de Profesores";
      case "tutores":
        return "Gestión de Tutores";
      case "mis-hijos":
        return user?.tipo === "tutor"
          ? "Perfil de mis hijos"
          : "Perfil del alumno";
      default:
        return "Inicio";
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
    </header>
  );
};

export default Header;
