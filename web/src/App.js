import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Overview from "./components/Overview";
import Asistencias from "./components/Asistencias";
import Alumnos from "./components/Alumnos";
import Mensajes from "./components/Mensajes";
import Profesores from "./components/Profesores";
import Tutores from "./components/Tutores";
import PerfilAlumno from "./components/PerfilAlumno";
import AlumnosPorGrupo from "./components/AlumnosPorGrupo";
import Grupos from "./components/Grupos";
import "./App.css";

function Dashboard() {
  const [seccionActiva, setSeccionActiva] = useState("overview");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [alumnoPerfilId, setAlumnoPerfilId] = useState(null);

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case "overview":
        return (
          <Overview
            onVerPerfil={(id) => {
              setAlumnoPerfilId(id);
              setSeccionActiva("mis-hijos");
            }}
          />
        );
      case "asistencias":
        return <Asistencias />;
      case "alumnos":
        return (
          <Alumnos
            onEditarAlumno={(alumnoId) => {
              setAlumnoPerfilId(alumnoId);
              setSeccionActiva("mis-hijos");
            }}
            onCrearAlumno={() => {
              setAlumnoPerfilId(null);
              setSeccionActiva("mis-hijos");
            }}
          />
        );
      case "alumnos-por-grupo":
        return <AlumnosPorGrupo />;
      case "mensajes":
        return <Mensajes />;
      case "profesores":
        return <Profesores />;
      case "tutores":
        return <Tutores />;
      case "grupos":
        return <Grupos />;
      case "mis-hijos":
        return <PerfilAlumno alumnoIdInicial={alumnoPerfilId} />;
      default:
        return <Overview />;
    }
  };

  const cambiarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    setSidebarAbierto(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={cambiarSeccion}
        abierto={sidebarAbierto}
        setAbierto={setSidebarAbierto}
      />
      <main className="main-content">
        <Header
          seccionActiva={seccionActiva}
          setSeccionActiva={setSeccionActiva}
          onMenuToggle={() => setSidebarAbierto(!sidebarAbierto)}
        />
        {renderizarSeccion()}
      </main>
      {sidebarAbierto && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarAbierto(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
