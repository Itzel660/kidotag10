const normalizarTexto = (valor) =>
  typeof valor === "string" ? valor.trim() : "";

export const obtenerCamposNombreAlumno = (alumno = {}) => ({
  nombre: normalizarTexto(alumno.nombre),
  apellidos: normalizarTexto(alumno.apellidos),
});

export const obtenerNombreCompletoAlumno = (alumno = {}) => {
  const nombreCompleto = normalizarTexto(alumno.nombreCompleto);
  if (nombreCompleto) {
    return nombreCompleto;
  }

  const { nombre, apellidos } = obtenerCamposNombreAlumno(alumno);
  return [nombre, apellidos].filter(Boolean).join(" ").trim();
};

export const obtenerTextoBusquedaAlumno = (alumno = {}) =>
  [
    obtenerNombreCompletoAlumno(alumno),
    normalizarTexto(alumno.nombre),
    normalizarTexto(alumno.apellidos),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const compararAlumnosPorNombre = (alumnoA, alumnoB) =>
  obtenerNombreCompletoAlumno(alumnoA).localeCompare(
    obtenerNombreCompletoAlumno(alumnoB),
    "es",
    { sensitivity: "base" },
  );
