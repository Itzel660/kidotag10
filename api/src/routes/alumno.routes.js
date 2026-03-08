const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumno.controller');

router.post('/', alumnoController.registrarAlumno);
router.get('/', alumnoController.listarAlumnos);
router.get('/:id', alumnoController.obtenerAlumno);
router.put('/:id', alumnoController.actualizarAlumno);
router.delete('/:id', alumnoController.eliminarAlumno);

module.exports = router;
