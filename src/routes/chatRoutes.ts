import express from 'express';
import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { uploadGroupPictureCloudinary } from '../middleware/cloudinaryGroupUpload';


const router: Router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       required:
 *         - name
 *         - participants
 *       properties:
 *         name:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *         isGroup:
 *           type: boolean
 *         groupPictureUrl:
 *           type: string
 *           description: URL of the group picture
 */

/**
 * @openapi
 * /api/chat/rooms:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRoom'
 *     responses:
 *       201:
 *         description: Chat room created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/rooms', async (req, res) => {
  await chatController.createChatRoomController(req, res);
});

/**
 * @openapi
 * /api/chat/rooms/user/{userId}:
 *   get:
 *     summary: Get user's chat rooms
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of chat rooms
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/rooms/user/:userId', async (req, res) => {
  await chatController.getChatRoomsForUserController(req, res);
});

/**
 * @openapi
 * /api/chat/rooms/{id}:
 *   get:
 *     summary: Get chat room details
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat room details
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/rooms/:id', async (req, res) => {
  await chatController.getChatRoomByIdController(req, res);
});

/**
 * @openapi
 * /api/chat/messages/{roomId}:
 *   get:
 *     summary: Get room messages
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of messages
 *       400:
 *         description: Invalid room ID
 *       500:
 *         description: Server error
 */
router.get('/messages/:roomId', async (req, res) => {
  await chatController.getMessagesForRoomController(req, res);
});

/**
 * @openapi
 * /api/chat/messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - senderId
 *               - content
 *             properties:
 *               roomId:
 *                 type: string
 *               senderId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/messages', async (req, res) => {
  await chatController.sendMessageController(req, res);
});

/**
 * @openapi
 * /api/chat/messages/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - userId
 *             properties:
 *               roomId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/messages/read', async (req, res) => {
  await chatController.markMessagesAsReadController(req, res);
});

/**
 * @openapi
 * /api/chat/rooms/{id}/group-picture:
 *   patch:
 *     summary: Update group picture of a chat room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - groupPicture
 *             properties:
 *               groupPicture:
 *                 type: string
 *                 format: binary
 *                 description: Group picture image file
 *     responses:
 *       200:
 *         description: Group picture updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 groupPictureUrl:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/rooms/:id/group-picture',
  uploadGroupPictureCloudinary.single('groupPicture'),
  async (req, res): Promise<void> => {
    try {
      console.log('Group picture upload request received');
      console.log(`Room ID: ${req.params.id}`);
      console.log(`File received: ${req.file ? 'Yes' : 'No'}`);
      
      if (req.file) {
        console.log(`File details:`, {
          filename: req.file.filename,
          originalname: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Set the uploaded file URL in the body for the controller
        req.body.groupPictureUrl = req.file.path;
      } else {
        console.log('No file received in upload request');
        res.status(400).json({ message: 'No se recibió ningún archivo' });
        return; // Explicit return without value
      }
      
      await chatController.updateGroupPictureController(req, res);
    } catch (error) {
      console.error('Error in group picture upload route:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

/**
 * @openapi
 * /api/chat/rooms/{id}:
 *   delete:
 *     summary: Delete a chat room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete('/rooms/:id', async (req, res) => {
  await chatController.deleteChatRoomController(req, res);
});

/**
 * @openapi
 * /api/chat/unread/{userId}:
 *   get:
 *     summary: Get unread messages count
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unread messages count per room
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/unread/:userId', async (req, res) => {
  await chatController.getUnreadMessagesCountController(req, res);
});

export default router;