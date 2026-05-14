import React, { useState, useEffect } from "react";
import { apiGet } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import { obtenerNombreCompletoAlumno } from "../utils/alumnoNombre";
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
        <div className="table-container">
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
                  <td data-label="Nombre">
                    {obtenerNombreCompletoAlumno(alumno)}
                  </td>
                  <td data-label="Email">{alumno.email}</td>
                  <td data-label="Grupo">
                    {alumno.grupo?.nombre || "Sin grupo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay alumnos disponibles.</p>
      )}
    </div>
  );
};

export default AlumnosPorGrupo;
