import express from 'express';
import * as activityController from '../controllers/activityController';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - author
 *         - name
 *         - startTime
 *         - endTime
 *         - duration
 *         - distance
 *         - elevationGain
 *         - averageSpeed
 *         - route
 *         - musicPlaylist
 *         - type
 *       properties:
 *         author:
 *           type: string
 *           format: objectId
 *           description: The ID of the user who authored the activity (reference to User model)
 *         name:
 *           type: string
 *           description: The name of the activity
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: The start time of the activity
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: The end time of the activity
 *         duration:
 *           type: number
 *           description: The duration of the activity in minutes
 *         distance:
 *           type: number
 *           description: The distance covered during the activity
 *         elevationGain:
 *           type: number
 *           description: The total elevation gain during the activity
 *         averageSpeed:
 *           type: number
 *           description: The average speed during the activity
 *         caloriesBurned:
 *           type: number
 *           description: The estimated calories burned during the activity (optional)
 *         route:
 *           type: array
 *           items:
 *             type: string
 *             format: objectId
 *           description: Array of reference point IDs representing the activity route
 *         musicPlaylist:
 *           type: array
 *           items:
 *             type: string
 *             format: objectId
 *           description: Array of song IDs representing the music playlist for the activity
 *         type:
 *           type: string
 *           enum: [running, cycling, hiking, walking]
 *           description: The type of activity
 *       example:
 *         author: "60d5ecb74d2dbb001f645a7c"
 *         name: "Morning Run"
 *         startTime: "2025-03-21T08:00:00Z"
 *         endTime: "2025-03-21T09:00:00Z"
 *         duration: 60
 *         distance: 10000
 *         elevationGain: 100
 *         averageSpeed: 10
 *         caloriesBurned: 500
 *         route: ["60d5ecb74d2dbb001f645a7d", "60d5ecb74d2dbb001f645a7e"]
 *         musicPlaylist: ["60d5ecb74d2dbb001f645a7f", "60d5ecb74d2dbb001f645a80"]
 *         type: "running"
 */

/**
 * @openapi
 * /api/activities:
 *   post:
 *     summary: Create a new activity associated with a user
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - author
 *               - name
 *               - startTime
 *               - endTime
 *               - duration
 *               - distance
 *               - elevationGain
 *               - averageSpeed
 *               - route
 *               - type
 *             properties:
 *               author:
 *                 type: objectId
 *                 description: The ID of the user who created the activity
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *               distance:
 *                 type: number
 *               elevationGain:
 *                 type: number
 *               averageSpeed:
 *                 type: number
 *               route:
 *                 type: array
 *                 items: 
 *                   referencePoint:
 *                     type: objectId
 *               type:
 *                 type: string
 *                 enum: [running, cycling, hiking, walking]
 *     responses:
 *       201:
 *         description: Activity created successfully
 */
router.post('/', activityController.createActivityController);
/**
 * @openapi
 * /api/activities/following/{userId}:
 *   get:
 *     summary: Get activities from users that the specified user follows (activity feed)
 *     tags: [Activities]
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
 *           default: 10
 *         description: Number of activities per page
 *     responses:
 *       200:
 *         description: Activities from followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                 totalActivities:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *                 followingCount:
 *                   type: integer
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/following/:userId', activityController.getFollowingActivitiesController);

/**
 * @openapi
 * /api/activities/{id}:
 *   get:
 *     summary: Get an activity by ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *       404:
 *         description: Activity not found
 */
router.get('/:id', activityController.getActivityByIdController);

/**
 * @openapi
 * /api/activities/user/{userId}:
 *   get:
 *     summary: Get all activities by user ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/user/:userId', activityController.getActivitiesByUserIdController);

/**
 * @openapi
 * /api/activities:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
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
 *         description: Number of activities per page
 *     responses:
 *       200:
 *         description: Activitats trobades
 *       401:
 *        description: No s'han trobat activitats
 *       500:
 *        description: Error del servidor
 */
router.get('/', activityController.getActivitiesHandler);

/**
 * @openapi
 * /api/activities/{id}:
 *   put:
 *     summary: Update an activity by ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *               distance:
 *                 type: number
 *               elevationGain:
 *                 type: number
 *               averageSpeed:
 *                 type: number
 *               route:
 *                 type: array
 *                 items: 
 *                   referencePoint:
 *                     type: objectId
 *               caloriesBurned:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [running, cycling, hiking, walking]
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Error updating activity
 */
router.put('/:id', activityController.updateActivityController);

/**
 * @openapi
 * /api/activities/{id}:
 *   delete:
 *     summary: Delete an activity by ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Error deleting activity
 */
router.delete('/:id', activityController.deleteActivityController);

export default router;
