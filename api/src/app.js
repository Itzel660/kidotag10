const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/itemRoutes");
const estadoRoutes = require("./routes/estado.routes");
const asistenciaRoutes = require("./routes/asistencia.routes");
const alumnoRoutes = require("./routes/alumno.routes");
const tutorRoutes = require("./routes/tutor.routes");
const profesorRoutes = require("./routes/profesor.routes");
const grupoRoutes = require("./routes/grupo.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentación Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "KidoTag API Documentation",
  }),
);

// Rutas
app.get("/", (req, res) => {
  res.json({
    mensaje: "API funcionando correctamente",
    documentacion: "/api-docs",
    version: "1.0.0",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/estado", estadoRoutes);
app.use("/api/v1/asistencias", asistenciaRoutes);
app.use("/api/v1/alumnos", alumnoRoutes);
app.use("/api/v1/tutores", tutorRoutes);
app.use("/api/v1/profesores", profesorRoutes);
app.use("/api/v1/grupos", grupoRoutes);
app.use("/api/items", itemRoutes);

module.exports = app;
