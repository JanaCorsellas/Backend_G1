import express from 'express';
import * as activityTrackingController from '../controllers/activityTrackingController';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     LocationPoint:
 *       type: object
 *       required:
 *         - latitude
 *         - longitude
 *       properties:
 *         latitude:
 *           type: number
 *           description: Latitud del punto GPS
 *         longitude:
 *           type: number
 *           description: Longitud del punto GPS
 *         altitude:
 *           type: number
 *           description: Altura sobre el nivel del mar (opcional)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Marca de tiempo del punto
 *         speed:
 *           type: number
 *           description: Velocidad en metros por segundo (opcional)
 *     ActivityTracking:
 *       type: object
 *       required:
 *         - userId
 *         - activityType
 *       properties:
 *         userId:
 *           type: string
 *           description: ID del usuario
 *         activityType:
 *           type: string
 *           enum: [running, cycling, hiking, walking]
 *           description: Tipo de actividad
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Hora de inicio
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Hora de finalización (si ha terminado)
 *         isActive:
 *           type: boolean
 *           description: Indica si el tracking está activo
 *         isPaused:
 *           type: boolean
 *           description: Indica si el tracking está en pausa
 *         currentDistance:
 *           type: number
 *           description: Distancia actual en metros
 *         currentDuration:
 *           type: number
 *           description: Duración actual en segundos
 *         currentSpeed:
 *           type: number
 *           description: Velocidad actual en metros por segundo
 *         averageSpeed:
 *           type: number
 *           description: Velocidad promedio en metros por segundo
 *         maxSpeed:
 *           type: number
 *           description: Velocidad máxima en metros por segundo
 *         elevationGain:
 *           type: number
 *           description: Ganancia de elevación en metros
 *         locationPoints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LocationPoint'
 */

/**
 * @openapi
 * /api/activity-tracking/start:
 *   post:
 *     summary: Iniciar una nueva actividad de tracking
 *     tags: [ActivityTracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - activityType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               activityType:
 *                 type: string
 *                 enum: [running, cycling, hiking, walking]
 *                 description: Tipo de actividad
 *     responses:
 *       201:
 *         description: Tracking iniciado con éxito
 *       400:
 *         description: Datos inválidos o ya existe un tracking activo
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/start', activityTrackingController.startTrackingController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}/location:
 *   post:
 *     summary: Actualizar ubicación en un tracking existente
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 description: Latitud del punto GPS
 *               longitude:
 *                 type: number
 *                 description: Longitud del punto GPS
 *               altitude:
 *                 type: number
 *                 description: Altura sobre el nivel del mar (opcional)
 *               speed:
 *                 type: number
 *                 description: Velocidad en metros por segundo (opcional)
 *     responses:
 *       200:
 *         description: Ubicación actualizada con éxito
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado o no está activo
 *       500:
 *         description: Error del servidor
 */
router.post('/:trackingId/location', activityTrackingController.updateLocationController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}/pause:
 *   post:
 *     summary: Pausar una actividad de tracking
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     responses:
 *       200:
 *         description: Tracking pausado con éxito
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado o no está activo
 *       500:
 *         description: Error del servidor
 */
router.post('/:trackingId/pause', activityTrackingController.pauseTrackingController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}/resume:
 *   post:
 *     summary: Reanudar una actividad de tracking pausada
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     responses:
 *       200:
 *         description: Tracking reanudado con éxito
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado, no está activo o no está pausado
 *       500:
 *         description: Error del servidor
 */
router.post('/:trackingId/resume', activityTrackingController.resumeTrackingController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}/finish:
 *   post:
 *     summary: Finalizar una actividad de tracking y convertirla en actividad permanente
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre opcional para la actividad
 *     responses:
 *       200:
 *         description: Tracking finalizado y actividad creada con éxito
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado o no está activo
 *       500:
 *         description: Error del servidor
 */
router.post('/:trackingId/finish', activityTrackingController.finishTrackingController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}/discard:
 *   delete:
 *     summary: Descartar un tracking (eliminar sin convertir en actividad)
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     responses:
 *       200:
 *         description: Tracking descartado con éxito
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:trackingId/discard', activityTrackingController.discardTrackingController);

/**
 * @openapi
 * /api/activity-tracking/{trackingId}:
 *   get:
 *     summary: Obtener detalles de un tracking por ID
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tracking
 *     responses:
 *       200:
 *         description: Detalles del tracking
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tracking no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:trackingId', activityTrackingController.getTrackingController);

/**
 * @openapi
 * /api/activity-tracking/user/{userId}/active:
 *   get:
 *     summary: Obtener todos los trackings activos de un usuario
 *     tags: [ActivityTracking]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de trackings activos
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.get('/user/:userId/active', activityTrackingController.getActiveTrackingsController);

export default router;