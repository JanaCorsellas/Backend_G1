// src/routes/notificationRoutes.ts
import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';

const router = Router();

/**
 * @openapi
 * /api/notifications/{userId}:
 *   get:
 *     summary: Get user notifications with pagination
 *     tags: [Notifications]
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only return unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [new_follower, achievement_unlocked, challenge_completed, activity_update, chat_message, friend_request, system]
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       data:
 *                         type: object
 *                       read:
 *                         type: boolean
 *                       priority:
 *                         type: string
 *                         enum: [low, normal, high]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalNotifications:
 *                   type: integer
 *                 unreadCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/:userId', notificationController.getUserNotificationsController);

/**
 * @openapi
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user who owns the notification
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notification:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:notificationId/read', notificationController.markNotificationAsReadController);

/**
 * @openapi
 * /api/notifications/{userId}/read-all:
 *   put:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *                   description: Number of notifications marked as read
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.put('/:userId/read-all', notificationController.markAllNotificationsAsReadController);

/**
 * @openapi
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user who owns the notification
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', notificationController.deleteNotificationController);

/**
 * @openapi
 * /api/notifications/{userId}/unread-count:
 *   get:
 *     summary: Get unread notifications count for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 unreadCount:
 *                   type: integer
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.get('/:userId/unread-count', notificationController.getUnreadCountController);

/**
 * @openapi
 * /api/notifications/{userId}/stats:
 *   get:
 *     summary: Get notification statistics for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Notification stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalNotifications:
 *                       type: integer
 *                     unreadNotifications:
 *                       type: integer
 *                     readNotifications:
 *                       type: integer
 *                     readPercentage:
 *                       type: integer
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.get('/:userId/stats', notificationController.getNotificationStatsController);

/**
 * @openapi
 * /api/notifications/test:
 *   post:
 *     summary: Create a test notification (for development)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [new_follower, achievement_unlocked, challenge_completed, activity_update, chat_message, friend_request, system]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *                 description: Additional data for the notification
 *     responses:
 *       201:
 *         description: Test notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notification:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.post('/test', notificationController.createTestNotificationController);

/**
 * @openapi
 * /api/notifications/cleanup:
 *   delete:
 *     summary: Clean up old read notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days old for notifications to be deleted
 *     responses:
 *       200:
 *         description: Old notifications cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       400:
 *         description: Invalid days parameter
 *       500:
 *         description: Server error
 */
router.delete('/cleanup', notificationController.cleanupOldNotificationsController);

export default router;
