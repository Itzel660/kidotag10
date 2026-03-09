const express = require("express");
const router = express.Router();
const estadoController = require("../controllers/estado.controller");

/**
 * @swagger
 * /api/v1/estado:
 *   get:
 *     summary: Obtener el estado del sistema
 *     tags: [Estado]
 *     responses:
 *       200:
 *         description: Estado del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mensaje:
 *                       type: string
 *                       example: Sistema operando correctamente
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get("/", estadoController.getEstado);

module.exports = router;
