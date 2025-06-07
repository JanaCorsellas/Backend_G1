import { Request, Response } from "express";
import { registerNewUser, loginUser, refreshUserToken, logoutUser, googleAuth } from "../services/auth_service";
import { OAuth2Client } from 'google-auth-library';
import axios from "axios";
import UserModel from "../models/user";
import { generateRefreshToken, generateToken } from "../utils/jwt.handle";
import { encrypt } from "../utils/bcrypt.handle";



export const registerCtrl = async ({body}: Request, res: Response) => {
    try{
        // Verificamos que username, email y password estén presentes
        const { username, email, password } = body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: "Todos los campos (username, email, password) son requeridos" 
            });
        }
        
        const responseUser = await registerNewUser(body);
        res.json(responseUser);
    } catch (error: any){
        res.status(500).json({ message: error.message });
    }
};

// Modificado: Enviar objeto usuario completo en la respuesta
export const loginCtrl = async ({ body }: Request, res: Response) => {
    try {
        const { username, email, password } = body;
        
        // Validamos que tengamos al menos email y password
        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email y password son requeridos" 
            });
        }
        
        const responseUser = await loginUser({username, email, password });

        if (responseUser === 'INCORRECT_PASSWORD') {
            return res.status(403).json({ message: 'Contraseña incorrecta' });
        }

        if (responseUser === 'NOT_FOUND_USER') {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.json({
            token: responseUser.token,
            refreshToken: responseUser.refreshToken,
            user: responseUser.user 
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

// Lo mismo para el método googleAuthCallback
export const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        
        if (!code) {
            return res.status(400).json({ message: 'Código de autorización faltante' });
        }

        const authData = await googleAuth(code);
        
        if (!authData) {
            return res.redirect('/login?error=authentication_failed');
        }
        
        // Redirigir al frontend con ambos tokens como parámetros de consulta
        res.redirect(`http://localhost:4200/?token=${authData.token}&refreshToken=${authData.refreshToken}`);   
    } catch (error: any) {
        console.error('Error en callback de Google:', error);
        res.redirect('/login?error=server_error');
    }
};

export const refreshTokenCtrl = async (req: Request, res: Response) => {
    try {
        // Obtenemos el refresh token de las cookies o del body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token no proporcionado' });
        }
        
        const result = await refreshUserToken(refreshToken);
        
        if (result === 'INVALID_REFRESH_TOKEN') {
            return res.status(401).json({ message: 'Refresh token inválido' });
        }
        
        if (result === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        if (result === 'REFRESH_TOKEN_MISMATCH') {
            return res.status(401).json({ message: 'Refresh token no coincide' });
        }
        
        // Configurar las cookies con los nuevos tokens
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });
        
        return res.json({ token: result.token });
        
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const logoutCtrl = async (req: Request, res: Response) => {
    try {
        // Obtenemos el id del usuario del token (que debería estar en req.user)
        const userId = (req as any).user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        
        await logoutUser(userId);
        
        // Eliminar cookies
        res.clearCookie('refreshToken');
        
        return res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const googleAuthCtrl = (req: Request, res: Response) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = new URLSearchParams({
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
  });

  const fullUrl = `${rootUrl}?${options.toString()}`;
  res.redirect(fullUrl);
};

export const googleCallbackCtrl = async (req: Request, res: Response) => {
    console.log(' Google OAuth Callback iniciado');
    console.log(' Query params:', req.query);
    
    const code = req.query.code as string;

    if (!code) {
        console.error(' No se recibió código de Google');
        return res.status(400).json({ message: 'Falta el código de Google' });
    }

    console.log(' Código de Google recibido:', code.substring(0, 20) + '...');

    try {

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_OAUTH_REDIRECT_URL) {
            console.error(' Variables de entorno faltantes');
            return res.status(500).json({ message: 'Configuración de Google OAuth incompleta' });
        }

        // INTERCAMBIAR CÓDIGO POR TOKEN
        console.log(' Intercambiando código por token...');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code',
        });

        console.log(' Token response recibido:', {
            status: tokenResponse.status,
            hasAccessToken: !!tokenResponse.data.access_token
        });

        const { access_token, id_token } = tokenResponse.data;

        if (!access_token) {
            console.error(' No se recibió access_token de Google');
            return res.status(500).json({ message: 'Error obteniendo token de Google' });
        }

        // OBTENER DATOS DEL USUARIO
        console.log(' Obteniendo datos del usuario de Google...');
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        console.log(' Datos de usuario recibidos:', {
            email: userResponse.data.email,
            name: userResponse.data.name,
            id: userResponse.data.id
        });

        const { email, name, id: googleId, picture } = userResponse.data;

        if (!email || !name) {
            console.error(' Datos incompletos del usuario de Google');
            return res.status(500).json({ message: 'Datos incompletos del usuario' });
        }

        // BUSCAR USUARIO
        console.log('🔍 Buscando usuario en base de datos...');
        let user = await UserModel.findOne({ email });

        if (!user) {
            console.log(' Creando nuevo usuario...');
            
            // GENERAR CONTRASEÑA ALEATORIA PARA NUEVOS USUARIOS
            const randomPassword = Math.random().toString(36).slice(-8);
            console.log(' Contraseña aleatoria generada para nuevo usuario');

            const hashedPassword = await encrypt(randomPassword);

            user = await UserModel.create({
                email,
                username: name,
                googleId,
                profilePicture: picture || null,
                password: hashedPassword,
                role: 'user',
                level: 1,
                totalDistance: 0,
                totalTime: 0,
                activities: [],
                achievements: [],
                challengesCompleted: [],
                visibility: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(' Usuario nuevo creado con ID:', user._id);
        } else {
            console.log(' Usuario existente encontrado:', user._id);
            
            // VERIFICAR Y ACTUALIZAR DATOS SI ES NECESARIO
            let needsUpdate = false;
            const updateData: any = {};

            if (!user.googleId) {
                updateData.googleId = googleId;
                needsUpdate = true;
                console.log('📝 Agregando googleId al usuario existente');
            }

            if (!user.password) {
                // Si el usuario no tiene contraseña, generar una
                const randomPassword = Math.random().toString(36).slice(-8);
                updateData.password = await encrypt(randomPassword);
                needsUpdate = true;
                console.log('🔐 Generando contraseña para usuario sin contraseña');
            }

            if (picture && (!user.profilePicture || user.profilePicture !== picture)) {
                updateData.profilePicture = picture;
                needsUpdate = true;
                console.log('📸 Actualizando foto de perfil');
            }

            // Actualizar usuario si es necesario (sin validar todo el documento)
            if (needsUpdate) {
                await UserModel.updateOne(
                    { _id: user._id }, 
                    { $set: updateData },
                    { runValidators: false } // No ejecutar validadores
                );
                console.log(' Usuario actualizado con nuevos datos');
                
                // Recargar usuario con los cambios
                user = await UserModel.findById(user._id);
            }
        }

        // GENERAR TOKENS JWT
        console.log(' Generando tokens JWT...');
        if (!user) {
            throw new Error('No se pudo obtener el usuario para generar tokens');
        }
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user.email);

        console.log(' Tokens generados:', {
            token: token.substring(0, 20) + '...',
            refreshToken: refreshToken.substring(0, 20) + '...'
        });

        // ⭐ GUARDAR REFRESH TOKEN SIN VALIDAR TODO EL DOCUMENTO
        console.log(' Guardando refresh token...');
        try {
            await UserModel.updateOne(
                { _id: user!._id },
                { $set: { refreshToken: refreshToken } },
                { runValidators: false } //  EVITA VALIDAR EL CAMPO PASSWORD
            );
            console.log(' Refresh token guardado exitosamente');
        } catch (saveError) {
            console.error(' Error guardando refresh token:', saveError);
            // Continuar sin guardar el refresh token si hay error
        }

        // REDIRECCIONAR CON TOKENS
        const redirectUrl = `http://localhost:5173/oauth-success?token=${token}&refreshToken=${refreshToken}`;
        console.log('🔄 Redirigiendo a:', redirectUrl.substring(0, 80) + '...');
        
        res.redirect(redirectUrl);

    } catch (err: any) {
        console.error(' Error en Google OAuth:', err);
        console.error('📄 Error completo:', {
            message: err.message,
            stack: err.stack,
            response: err.response?.data
        });
        
        res.status(500).json({ 
            message: 'Error en autenticación con Google',
            debug: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};