const express = require("express");
const router = express.Router();
const anuncioController = require("../controllers/anuncio.controller");
const {
  verificarToken,
  esProfesor,
} = require("../middlewares/auth.middleware");

router.use(verificarToken);

/**
 * @swagger
 * /api/v1/anuncios:
 *   get:
 *     summary: Obtener anuncios según el rol autenticado
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de anuncios
 */
router.get("/", anuncioController.obtenerAnuncios);

/**
 * @swagger
 * /api/v1/anuncios:
 *   post:
 *     summary: Crear un anuncio broadcast (solo profesores)
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Anuncio creado exitosamente
 */
router.post("/", esProfesor, anuncioController.crearAnuncio);

/**
 * @swagger
 * /api/v1/anuncios/{id}/ver:
 *   put:
 *     summary: Registrar que un tutor vio un anuncio
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Anuncio marcado como visto
 */
router.put("/:id/ver", anuncioController.marcarAnuncioVisto);

module.exports = router;