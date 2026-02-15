// Obtener estado del sistema
exports.getEstado = async (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      data: {
        servicio: "KidoTag API",
        estado: "activo",
        version: "v1"
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor"
      }
    });
  }
};
