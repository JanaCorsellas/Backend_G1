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
 *         - usersUnlocked
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
 *         usersUnlocked:
 *           type: string
 *           format: objectId
 *           description: The ID of the user who unlocked this achievement (reference to User model)
 *       example:
 *         title: "Marathon Finisher"
 *         description: "Complete a full marathon (42.195 km)"
 *         condition: "Run a total distance of 42.195 km in a single activity"
 *         icon: "https://example.com/icons/marathon.png"
 *         usersUnlocked: "60d5ecb74d2dbb001f645a7c"
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
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - condition
 *               - icon
 *               - usersUnlocked
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del logro
 *                 example: "Primer Kilómetro"
 *               description:
 *                 type: string
 *                 description: Descripción detallada del logro
 *                 example: "Completa tu primer kilómetro corriendo"
 *               condition:
 *                 type: string
 *                 description: Condición para desbloquear el logro
 *                 example: "Distancia >= 1km"
 *               icon:
 *                 type: string
 *                 description: URL o nombre del icono del logro
 *                 example: "medal_bronze.png"
 *               usersUnlocked:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de los usuarios que han desbloqueado el logro
 *                 example: 
 *                   - "507f1f77bcf86cd799439011"
 *                   - "67dab4abca02f3aa7a28b6ab"
 *     responses:
 *       201:
 *         description: Logro creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logro creado exitosamente"
 *                 achievement:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID único del logro
 *                       example: "507f1f77bcf86cd799439011"
 *                     title:
 *                       type: string
 *                       example: "Primer Kilómetro"
 *                     description:
 *                       type: string
 *                       example: "Completa tu primer kilómetro corriendo"
 *                     condition:
 *                       type: string
 *                       example: "Distancia >= 1km"
 *                     icon:
 *                       type: string
 *                       example: "medal_bronze.png"
 *                     usersUnlocked:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "507f1f77bcf86cd799439011"
 *                         - "67dab4abca02f3aa7a28b6ab"
 *       400:
 *         description: Datos inválidos en la petición
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todos los campos son requeridos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al crear el logro"
 *                 error:
 *                   type: string
 */
router.post('/', achievementController.createAchievementController);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID único del logro
 *                   example: "507f1f77bcf86cd799439011"
 *                 title:
 *                   type: string
 *                   description: Título del logro
 *                   example: "Primer Kilometro"
 *                 description:
 *                   type: string
 *                   description: Descripción del logro
 *                   example: "Completa tu primer kilómetro corriendo"
 *                 condition:
 *                   type: string
 *                   description: Condición para desbloquear el logro
 *                   example: "Distancia >= 1km"
 *                 icon:
 *                   type: string
 *                   description: URL o nombre del icono del logro
 *                   example: "medal_bronze.png"
 *                 usersUnlocked:
 *                   type: string
 *                   description: ID del usuario que ha desbloqueado el logro
 *                   example: "507f1f77bcf86cd799439011"
 *       404:
 *         description: Logro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontró el logro"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener el logro"
 *                 error:
 *                   type: string
 */
router.get('/:id', achievementController.getAchievementbyIdController);

/**
 * @openapi
 * /api/achievements:
 *   get:
 *     summary: Get all achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Lista de logros obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logros obtenidos exitosamente"
 *                 total:
 *                   type: number
 *                   description: Número total de logros
 *                   example: 3
 *                 achievements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID único del logro
 *                         example: "507f1f77bcf86cd799439011"
 *                       title:
 *                         type: string
 *                         description: Título del logro
 *                         example: "Primer quilòmetre"
 *                       description:
 *                         type: string
 *                         description: Descripción del logro
 *                         example: "Completa tu primer kilómetro corriendo"
 *                       condition:
 *                         type: string
 *                         description: Condición para desbloquear el logro
 *                         example: "Distancia >= 1km"
 *                       icon:
 *                         type: string
 *                         description: URL o nombre del icono del logro
 *                         example: "medal_bronze.png"
 *                       usersUnlocked:
 *                         type: string
 *                         description: ID del usuario que ha desbloqueado el logro
 *                         example: "507f1f77bcf86cd799439011"
 *       404:
 *         description: No se encontraron logros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontraron logros disponibles"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener los logros"
 *                 error:
 *                   type: string
 */
router.get('/', achievementController.getAllAchievementController);

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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nuevo título del logro
 *                 example: "Primer Kilometro"
 *               description:
 *                 type: string
 *                 description: Nueva descripción del logro
 *                 example: "Completa tu primer kilómetro corriendo"
 *               condition:
 *                 type: string
 *                 description: Nueva condición para desbloquear el logro
 *                 example: "Distancia >= 1km"
 *               icon:
 *                 type: string
 *                 description: Nueva URL o nombre del icono del logro
 *                 example: "medal_bronze.png"
 *               usersUnlocked:
 *                 type: string
 *                 description: Nuevo ID del usuario que ha desbloqueado el logro
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Logro actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logro actualizado exitosamente"
 *                 achievement:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID del logro
 *                       example: "507f1f77bcf86cd799439011"
 *                     title:
 *                       type: string
 *                       example: "Primer Kilometro"
 *                     description:
 *                       type: string
 *                       example: "Completa tu primer kilómetro corriendo"
 *                     condition:
 *                       type: string
 *                       example: "Distancia >= 1km"
 *                     icon:
 *                       type: string
 *                       example: "medal_bronze.png"
 *                     usersUnlocked:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *       404:
 *         description: Logro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontró el logro"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al actualizar el logro"
 *                 error:
 *                   type: string
 */
router.put('/:id', achievementController.updateAchievementController);

/**
 * @openapi
 * /api/achievements/delete/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *                   example: "Logro eliminado exitosamente"
 *       404:
 *         description: Logro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontró el logro"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al eliminar el logro"
 *                 error:
 *                   type: string
 */
router.delete('/delete/:id', achievementController.deleteAchievementController);

export default router;



/*Logros obtenidos:  []
Error al obtener los logros: Error: Cannot set headers after they are sent to the client
    at ServerResponse.setHeader (node:_http_outgoing:699:11)
    at ServerResponse.header (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:794:10)
    at ServerResponse.send (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:174:12)
    at ServerResponse.json (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:278:15)
    at C:\ProyectoEA\Backend_G1\src\controllers\achievementController.ts:55:25
    at Generator.next (<anonymous>)
    at fulfilled (C:\ProyectoEA\Backend_G1\src\controllers\achievementController.ts:38:58)
    at processTicksAndRejections (node:internal/process/task_queues:105:5) {
  code: 'ERR_HTTP_HEADERS_SENT'
}
Error: Cannot set headers after they are sent to the client
    at ServerResponse.setHeader (node:_http_outgoing:699:11)
    at ServerResponse.header (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:794:10)
    at ServerResponse.send (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:174:12)
    at ServerResponse.json (C:\ProyectoEA\Backend_G1\node_modules\express\lib\response.js:278:15)
    at C:\ProyectoEA\Backend_G1\src\controllers\achievementController.ts:61:25
    at Generator.next (<anonymous>)
    at fulfilled (C:\ProyectoEA\Backend_G1\src\controllers\achievementController.ts:38:58)
    at processTicksAndRejections (node:internal/process/task_queues:105:5) {
  code: 'ERR_HTTP_HEADERS_SENT'
}*/

///manejar ese error, para que no ocurra más o no cierre el programa