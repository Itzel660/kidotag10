const mongoose = require("mongoose");

const asistenciaSchema = new mongoose.Schema(
  {
    uidTarjeta: {
      type: String,
      required: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ["entrada", "salida"],
    },
    fechaHora: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Asistencia", asistenciaSchema);
