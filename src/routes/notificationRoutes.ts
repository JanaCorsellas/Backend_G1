import express, { Request, Response, NextFunction } from 'express';
import * as notificationController from '../controllers/notificationController';
import { checkJwt } from "../middleware/session";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - recipient
 *         - sender
 *         - type
 *         - content
 *         - isRead
 *       properties:
 *         recipient:
 *           type: string
 *           format: objectId
 *           description: ID del usuario destinatario
 *         sender:
 *           type: string
 *           format: objectId
 *           description: ID del usuario remitente
 *         type:
 *           type: string
 *           enum: [chat, activity, challenge, achievement, follow, system]
 *           description: Tipo de notificación
 *         content:
 *           type: string
 *           description: Contenido de la notificación
 *         entityId:
 *           type: string
 *           format: objectId
 *           description: ID de la entidad relacionada (opcional)
 *         entityType:
 *           type: string
 *           enum: [ChatRoom, Message, Activity, Challenge, Achievement, User]
 *           description: Tipo de la entidad relacionada (opcional)
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Estado de lectura de la notificación
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la notificación
 *       example:
 *         recipient: "60d725b4e2f7cb001bce5ab1"
 *         sender: "60d725b4e2f7cb001bce5ab2"
 *         type: "chat"
 *         content: "Juan te ha enviado un mensaje"
 *         entityId: "60d725b4e2f7cb001bce5ab3"
 *         entityType: "ChatRoom"
 *         isRead: false
 *         createdAt: "2023-05-01T10:30:00Z"
 */

// Middleware wrapper to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * @openapi
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Get notifications for a specific user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: User not authorized
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.getUserNotificationsController(req, res);
}));

/**
 * @openapi
 * /api/notifications/unread/{userId}:
 *   get:
 *     summary: Get unread notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notifications to return
 *     responses:
 *       200:
 *         description: List of unread notifications
 *       401:
 *         description: User not authorized
 *       500:
 *         description: Server error
 */
router.get('/unread/:userId', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.getUnreadNotificationsController(req, res);
}));

/**
 * @openapi
 * /api/notifications/count/{userId}:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Count of unread notifications
 *       401:
 *         description: User not authorized
 *       500:
 *         description: Server error
 */
router.get('/count/:userId', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.getUnreadNotificationsCountController(req, res);
}));

/**
 * @openapi
 * /api/notifications/{id}/mark-read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:id/mark-read', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.markNotificationAsReadController(req, res);
}));

/**
 * @openapi
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: User not authorized
 *       500:
 *         description: Server error
 */
router.put('/mark-all-read', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.markAllNotificationsAsReadController(req, res);
}));

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.deleteNotificationController(req, res);
}));

/**
 * @openapi
 * /api/notifications/test:
 *   post:
 *     summary: Create a test notification (for development)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - senderId
 *               - type
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               senderId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [chat, activity, challenge, achievement, follow, system]
 *               content:
 *                 type: string
 *               entityId:
 *                 type: string
 *               entityType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test notification created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/test', checkJwt, asyncHandler(async (req, res) => {
  await notificationController.createTestNotificationController(req, res);
}));

export default router;