import {Router} from 'express';
import * as achievementController from '../controllers/achievementController';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Achievement:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - condition
 *         - icon
 *         - type
 *         - targetValue
 *         - difficulty
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the achievement
 *         description:
 *           type: string
 *           description: A detailed description of the achievement
 *         condition:
 *           type: string
 *           description: The condition required to unlock the achievement
 *         icon:
 *           type: string
 *           description: A URL or path to the icon representing the achievement
 *         type:
 *           type: string
 *           enum: [distance_total, distance_single, time_total, time_single, time_monthly, time_yearly, activity_count, consecutive_days, speed_average, elevation_gain]
 *           description: Type of achievement
 *         targetValue:
 *           type: number
 *           description: Target value to unlock the achievement
 *         activityType:
 *           type: string
 *           enum: [running, cycling, hiking, walking, all]
 *           description: Specific activity type (optional)
 *         difficulty:
 *           type: string
 *           enum: [bronze, silver, gold, diamond]
 *           description: Difficulty level of the achievement
 *         points:
 *           type: number
 *           description: Points awarded for unlocking
 *         usersUnlocked:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of users who unlocked this achievement
 *       example:
 *         title: "Primer Kilómetro"
 *         description: "Completa tu primer kilómetro corriendo"
 *         condition: "Distancia >= 1km"
 *         icon: "directions_run"
 *         type: "distance_total"
 *         targetValue: 1000
 *         activityType: "all"
 *         difficulty: "bronze"
 *         points: 10
 *         usersUnlocked: []
 */

/**
 * @openapi
 * /api/achievements:
 *   post:
 *     summary: Crear un nuevo logro
 *     tags: [Achievements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Achievement'
 *     responses:
 *       201:
 *         description: Logro creado exitosamente
 *       400:
 *         description: Datos inválidos en la petición
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', achievementController.createAchievementHandler);

/**
 * @openapi
 * /api/achievements/{id}:
 *   get:
 *     summary: Get an achievement by ID
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del logro a buscar
 *     responses:
 *       200:
 *         description: Logro encontrado exitosamente
 *       404:
 *         description: Logro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', achievementController.getAchievementbyIdHandler);

/**
 * @openapi
 * /api/achievements:
 *   get:
 *     summary: Get all achievements (paginated)
 *     tags: [Achievements]
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
 *           default: 50
 *         description: Number of achievements per page
 *     responses:
 *       200:
 *         description: Lista de logros obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', achievementController.getAchievementsController);

/**
 * @openapi
 * /api/achievements/all/list:
 *   get:
 *     summary: Get all achievements (no pagination)
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Todos los logros obtenidos exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/all/list', achievementController.getAllAchievementsController);

/**
 * @openapi
 * /api/achievements/user/{userId}:
 *   get:
 *     summary: Get user achievements (locked and unlocked)
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Logros del usuario obtenidos exitosamente
 *       400:
 *         description: ID de usuario requerido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/user/:userId', achievementController.getUserAchievementsController);

/**
 * @openapi
 * /api/achievements/user/{userId}/check:
 *   post:
 *     summary: Check and unlock new achievements for user
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Verificación completada
 *       400:
 *         description: ID de usuario requerido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/user/:userId/check', achievementController.checkUserAchievementsController);

/**
 * @openapi
 * /api/achievements/cleanup-duplicates:
 *   post:
 *     summary: Clean up duplicate achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Duplicados eliminados exitosamente
 *       500:
 *         description: Error eliminando duplicados
 */
router.post('/cleanup-duplicates', achievementController.cleanupDuplicatesController);

/**
 * @openapi
 * /api/achievements/initialize/defaults:
 *   post:
 *     summary: Initialize default achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Logros por defecto inicializados
 *       500:
 *         description: Error interno del servidor
 */
router.post('/initialize/defaults', achievementController.initializeAchievementsController);

/**
 * @openapi
 * /api/achievements/initialize/general:
 *   post:
 *     summary: Initialize general achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: General achievements initialized
 *       500:
 *         description: Error interno del servidor
 */
router.post('/initialize/general', achievementController.initializeGeneralAchievementsController);

/**
 * @openapi
 * /api/achievements/initialize/distance-total:
 *   post:
 *     summary: Initialize total distance achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Total distance achievements initialized
 *       500:
 *         description: Error interno del servidor
 */
router.post('/initialize/distance-total', achievementController.initializeDistanceTotalAchievementsController);

/**
 * @openapi
 * /api/achievements/initialize/distance-single:
 *   post:
 *     summary: Initialize single distance achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Single distance achievements initialized
 *       500:
 *         description: Error interno del servidor
 */
router.post('/initialize/distance-single', achievementController.initializeDistanceSingleAchievementsController);

/**
 * @openapi
 * /api/achievements/initialize/activity-specific:
 *   post:
 *     summary: Initialize activity-specific achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Activity-specific achievements initialized
 *       500:
 *         description: Error interno del servidor
 */
router.post('/initialize/activity-specific', achievementController.initializeActivitySpecificAchievementsController);

/**
 * @openapi
 * /api/achievements/{id}:
 *   put:
 *     summary: Update an existing achievement
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del logro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Achievement'
 *     responses:
 *       200:
 *         description: Logro actualizado exitosamente
 *       404:
 *         description: Logro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', achievementController.updateAchievementHandler);

/**
 * @openapi
 * /api/achievements/{id}:
 *   delete:
 *     summary: Delete an existing achievement
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del logro a eliminar
 *     responses:
 *       200:
 *         description: Logro eliminado exitosamente
 *       404:
 *         description: Logro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', achievementController.deleteAchievementHandler);

export default router;