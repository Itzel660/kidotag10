const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');

router.post('/', asistenciaController.registrarAsistencia);
router.get('/', asistenciaController.listarAsistencias);

module.exports = router;
