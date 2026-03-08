import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import Asistencias from './components/Asistencias';
import Alumnos from './components/Alumnos';
import './App.css';

function App() {
  const [seccionActiva, setSeccionActiva] = useState('overview');
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const renderizarSeccion = () => {
    switch (seccionActiva) {
      case 'overview':
        return <Overview />;
      case 'asistencias':
        return <Asistencias />;
      case 'alumnos':
        return <Alumnos />;
      default:
        return <Overview />;
    }
  };

  const cambiarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    setSidebarAbierto(false); // Cerrar sidebar en móvil al cambiar sección
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

export default App;
