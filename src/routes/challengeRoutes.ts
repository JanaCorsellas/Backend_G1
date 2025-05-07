import express from 'express';
import * as challengeController from '../controllers/challengeController';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Challenge:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - goalType
 *         - goalValue
 *         - reward
 *         - startDate
 *         - endDate
 *       properties:
 *         title:
 *           type: string
 *           description: El títol del repte
 *         description:
 *           type: string
 *           description: La descripció del repte
 *         goalType:
 *           type: string
 *           description: El tipus d'objectiu a batre (distància, temps, velocitat)
 *         goalValue:
 *           type: string
 *           description: El valor numèric de l'objectiu a batre ("5 km", "10 min", "20 km/h")
 *         reward:
 *           type: number
 *           description: Els punts d'experiència que aporta completar el repte
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: El dia que comença el repte
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: El dia que acaba el repte
 *       example:
 *         title: "5K Run Challenge"
 *         description: "Completa una ruta de 5 quilòmetres"
 *         goalType: "distance"
 *         goalValue: "5 km"
 *         reward: 100
 *         startDate: "2025-04-01T00:00:00Z"
 *         endDate: "2025-04-30T23:59:59Z"
 */

/**
 * @openapi
 * /api/challenges:
 *   post:
 *     summary: Create a new challenge
 *     tags: [Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               goalType:
 *                 type: string
 *               goalValue:
 *                 type: string
 *               reward:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Challenge creado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID único del challenge
 *                 title:
 *                   type: string
 *                   description: Título del challenge
 *                 description:
 *                   type: string
 *                   description: Descripción del challenge
 *                 goalType:
 *                   type: string
 *                   description: Tipo de objetivo
 *                 goalValue:
 *                   type: string
 *                   description: Objetivo del challenge
 *                 reward:
 *                   type: number
 *                   description: Recompensa del challenge
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de inicio
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de finalización
 *       400:
 *         description: Datos inválidos en la petición
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/', challengeController.createChallengeController);

/**
 * @openapi
 * /api/challenges/{id}:
 *   get:
 *     summary: Get a challenge by its ID
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del challenge a buscar
 *     responses:
 *       200:
 *         description: Challenge encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID único del challenge
 *                 title:
 *                   type: string
 *                   description: Título del challenge
 *                 description:
 *                   type: string
 *                   description: Descripción del challenge
 *                 goalType:
 *                   type: string
 *                   description: Tipo de objetivo
 *                 goalValue:
 *                   type: string
 *                   description: Valor del objetivo
 *                 reward:
 *                   type: number
 *                   description: Recompensa del challenge
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de inicio
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de finalización
 *       404:
 *         description: Challenge no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/:id', challengeController.getChallengeByIdController);

/**
 * @openapi
 * /api/challenges/:
 *   get:
 *     summary: Get all challenges
 *     tags: [Challenges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of challenges per page
 *     responses:
 *       200:
 *         description: Reptes trobats amb èxits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID únic del repte
 *                 title:
 *                   type: string
 *                   description: Títol del repte
 *                 description:
 *                   type: string
 *                   description: Descripció del repte
 *                 goalType:
 *                   type: string
 *                   description: Tipus d'objectiu
 *                 goalValue:
 *                   type: string
 *                   description: Valor de l'objectiu
 *                 reward:
 *                   type: number
 *                   description: Recompensa del repte
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Data d'inicio
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Data de finalización
 *       401:
 *        description: No s'han trobat reptes
 *       500:
 *         description: Error intern del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: Error interno del servidor
 */
router.get('/', challengeController.getChallengesController);

/**
 * @openapi
 * /api/challenges/active:
 *   get:
 *     summary: Get all active challenges
 *     tags: [Challenges]
 *     responses:
 *       200:
 *         description: Lista de challenges activos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito
 *                   example: "Challenges activos obtenidos exitosamente"
 *                 challenges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID único del challenge
 *                       title:
 *                         type: string
 *                         description: Título del challenge
 *                       description:
 *                         type: string
 *                         description: Descripción del challenge
 *                       goalType:
 *                         type: string
 *                         description: Tipo de objetivo
 *                       goalValue:
 *                         type: string
 *                         description: Valor del objetivo
 *                       reward:
 *                         type: number
 *                         description: Recompensa del challenge
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Fecha de inicio
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: Fecha de finalización
 *       404:
 *         description: No se encontraron challenges activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontraron challenges activos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener los challenges activos"
 */
router.get('/active', challengeController.getActiveChallengesController);

/**
 * @openapi
 * /api/challenges/inactive:
 *   get:
 *     summary: Get all inactive challenges
 *     tags: [Challenges]
 *     responses:
 *       200:
 *         description: Lista de challenges inactivos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito
 *                   example: "Challenges inactivos obtenidos exitosamente"
 *                 challenges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID único del challenge
 *                       title:
 *                         type: string
 *                         description: Título del challenge
 *                       description:
 *                         type: string
 *                         description: Descripción del challenge
 *                       goalType:
 *                         type: string
 *                         description: Tipo de objetivo
 *                       goalValue:
 *                         type: string
 *                         description: Valor del objetivo
 *                       reward:
 *                         type: number
 *                         description: Recompensa del challenge
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Fecha de inicio
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: Fecha de finalización
 *       404:
 *         description: No se encontraron challenges inactivos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontraron challenges inactivos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener los challenges inactivos"
 */
router.get('/inactive', challengeController.getInactiveChallengesController);

/**
 * @openapi
 * /api/challenges/{id}:
 *   put:
 *     summary: Update a challenge
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del challenge a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nuevo título del challenge
 *               description:
 *                 type: string
 *                 description: Nueva descripción del challenge
 *               goalType:
 *                 type: string
 *                 description: Nuevo tipo de objetivo
 *               goalValue:
 *                 type: string
 *                 description: Nuevo valor del objetivo
 *               reward:
 *                 type: number
 *                 description: Nueva recompensa del challenge
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de inicio
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de finalización
 *     responses:
 *       200:
 *         description: Challenge actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID del challenge
 *                 title:
 *                   type: string
 *                   description: Título actualizado
 *                 description:
 *                   type: string
 *                   description: Descripción actualizada
 *                 goalType:
 *                   type: string
 *                   description: Tipo de objetivo actualizado
 *                 goalValue:
 *                   type: string
 *                   description: Valor del objetivo actualizado
 *                 reward:
 *                   type: number
 *                   description: Recompensa actualizada
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de inicio actualizada
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Fecha de finalización actualizada
 *       404:
 *         description: Challenge no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:id', challengeController.updateChallengeController);


/**
 * @openapi
 * /api/challenges/{id}:
 *   delete:
 *     summary: Delete a challenge
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del challenge a eliminar
 *     responses:
 *       200:
 *         description: Challenge eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *                   example: "Challenge eliminado exitosamente"
 *       404:
 *         description: Challenge no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontró el challenge"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al eliminar el challenge"
 */
router.delete('/delete/:challengeId', challengeController.deleteChallengeController);

export default router;