import React, { useState, useEffect } from "react";
import { apiGet } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import "./Alumnos.css";

const AlumnosPorGrupo = () => {
  const { token } = useAuth();
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet("profesores/grupos/alumnos", token);
      if (datos.ok) {
        setAlumnos(datos.data);
      } else {
        alert(datos.error?.mensaje || "Error al cargar alumnos");
      }
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
      alert("Error al cargar alumnos");
    }
  };

  return (
    <div className="alumnos-container">
      <h2>Alumnos por Grupo</h2>
      {alumnos.length > 0 ? (
        <table className="alumnos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Grupo</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno._id}>
                <td>{alumno.nombre}</td>
                <td>{alumno.email}</td>
                <td>{alumno.grupo?.nombre || "Sin grupo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay alumnos disponibles.</p>
      )}
    </div>
  );
};

export default AlumnosPorGrupo;
