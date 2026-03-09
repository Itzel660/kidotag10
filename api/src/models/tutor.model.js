const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ["web", "mobile"],
      required: true,
    },
    deviceName: String,
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const tutorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    alumnos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alumno",
      },
    ],
    devices: [deviceSchema],
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hashear password antes de guardar
tutorSchema.pre("save", async function () {
  // Solo hashear si el password fue modificado
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Tutor", tutorSchema);
