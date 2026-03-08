const express = require('express');
const cors = require('cors');
const itemRoutes = require('./routes/itemRoutes');
const estadoRoutes = require('./routes/estado.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const alumnoRoutes = require('./routes/alumno.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({ mensaje: 'API funcionando correctamente' });
});

app.use('/api/v1/estado', estadoRoutes);
app.use('/api/v1/asistencias', asistenciaRoutes);
app.use('/api/v1/alumnos', alumnoRoutes);
app.use('/api/items', itemRoutes);

module.exports = app;
