const mongoose = require("mongoose");

const anuncioVistaSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    fechaVista: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const anuncioSchema = new mongoose.Schema(
  {
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profesor",
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    alcance: {
      type: String,
      enum: ["grupo", "tutores", "todos"],
      required: true,
    },
    grupo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grupo",
    },
    grupoNombre: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    destinatarios: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tutor",
          required: true,
        },
      ],
      validate: {
        validator: (destinatarios) =>
          Array.isArray(destinatarios) && destinatarios.length > 0,
        message: "El anuncio debe tener al menos un destinatario",
      },
    },
    vistoPor: [anuncioVistaSchema],
  },
  {
    timestamps: true,
  },
);

anuncioSchema.index({ autor: 1, createdAt: -1 });
anuncioSchema.index({ destinatarios: 1, createdAt: -1 });
anuncioSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Anuncio", anuncioSchema);