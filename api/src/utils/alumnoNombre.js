const limpiarTexto = (valor) => (typeof valor === "string" ? valor.trim() : "");

const obtenerNombreCompletoAlumno = (alumno = {}) => {
  const nombre = limpiarTexto(alumno.nombre);
  const apellidos = limpiarTexto(alumno.apellidos);

  return [nombre, apellidos].filter(Boolean).join(" ").trim();
};

module.exports = {
  limpiarTexto,
  obtenerNombreCompletoAlumno,
};
