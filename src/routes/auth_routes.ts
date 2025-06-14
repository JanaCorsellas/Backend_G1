import express, { Router, Request, Response } from 'express';
import { 
    registerCtrl, 
    loginCtrl, 
    refreshTokenCtrl, 
    logoutCtrl,
    googleAuthCtrl,
    googleCallbackCtrl 
} from '../controllers/auth_controller';
import { checkJwt } from "../middleware/session";
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

const router: Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRegister:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - email
 *       properties:
 *         username:
 *           type: string
 *           description: El nombre de usuario (obligatorio)
 *         password:
 *           type: string
 *           description: La contraseña del usuario
 *         email:
 *           type: string
 *           description: El correo electrónico del usuario
 * 
 *       example:
 *         username: "Usuario Ejemplo"
 *         password: "contraseña123"
 *         email: "usuario@example.com"
 *     AuthLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: El email del usuario
 *         password:
 *           type: string
 *           description: La contraseña del usuario
 *       example:
 *         email: "usuario@ejemplo.com"
 *         password: "contraseña123"
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: El token de refresco
 *       example:
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post("/register", async (req: Request, res: Response) => {
    try {
        await registerCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión un usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       400:
 *         description: Error en la solicitud
 */
router.post("/login", async (req: Request, res: Response) => {
    try {
        await loginCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/user/{userId}:
 *   get:
 *     summary: Obtiene los datos de un usuario
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario obtenidos exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
    try {
        await getUserByIdCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresca el token de acceso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Token de refresco inválido
 */
router.post("/refresh", async (req: Request, res: Response) => {
    try {
        await refreshTokenCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cierra la sesión del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: No autorizado
 */

router.post("/logout", checkJwt, async (req: Request, res: Response) => {
    try {
        await logoutCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Redirige al usuario a Google para autenticarse
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirección a Google para autenticación
 */
router.get('/google', async (req: Request, res: Response) => {
    try {
        await googleAuthCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Autenticación exitosa, redirige al frontend con el token
 *       400:
 *         description: Error en la autenticación
 */
router.get('/google/callback', async (req: Request, res: Response) => {
    try {
        await googleCallbackCtrl(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;

function getUserByIdCtrl(req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: express.Response<any, Record<string, any>>) {
    throw new Error('Function not implemented.');
}