import { Request, Response } from "express";
import { registerNewUser, loginUser, refreshUserToken, logoutUser, googleAuth } from "../services/auth_service";
import { OAuth2Client } from 'google-auth-library';
import axios from "axios";
import UserModel from "../models/user";
import { generateRefreshToken, generateToken } from "../utils/jwt.handle";


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

// En src/controllers/auth_controller.ts
// Reemplazar el método googleAuthCallback completo:

export const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        
        if (!code) {
            console.log("No se recibió código de Google");
            return res.redirect('http://localhost:8080?error=no_code');
        }

        console.log("Procesando código de Google para web:", code.substring(0, 20) + "...");

        const authData = await googleAuth(code);
        
        if (!authData) {
            console.log("Error en autenticación con Google");
            return res.redirect('http://localhost:8080?error=auth_failed');
        }
        
        console.log("Autenticación Google exitosa para:", authData.user.email);
        
        // ✅ CORREGIDO: Crear una página HTML que guarde correctamente en localStorage
        const resultHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Autenticación exitosa</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    max-width: 500px;
                    margin: 0 auto;
                }
                .success { 
                    font-size: 24px; 
                    margin-bottom: 20px;
                }
                .loading {
                    font-size: 16px;
                    opacity: 0.8;
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">¡Autenticación con Google exitosa!</div>
                <div>Bienvenido, ${authData.user.username}</div>
                <div class="spinner"></div>
                <div class="loading">Guardando datos y redirigiendo...</div>
            </div>
            
            <script>
                console.log('🚀 Procesando datos de Google Auth...');
                
                // ✅ CORREGIDO: Definir los datos correctamente
                const googleAuthData = {
                    token: "${authData.token}",
                    refreshToken: "${authData.refreshToken}",
                    user: {
                        _id: "${authData.user._id}",
                        id: "${authData.user._id}",
                        username: "${authData.user.username}",
                        email: "${authData.user.email}",
                        role: "${authData.user.role}",
                        profilePicture: ${authData.user.profilePicture ? `"${authData.user.profilePicture}"` : 'null'},
                        level: ${authData.user.level},
                        googleId: "${authData.user.googleId || ''}"
                    }
                };
                
                try {
                    // ✅ CORREGIDO: Guardar con los nombres que espera el frontend
                    localStorage.setItem('google_auth_data', JSON.stringify(googleAuthData));
                    localStorage.setItem('google_auth_success', 'true');
                    
                    // También guardar en el formato tradicional por compatibilidad
                    localStorage.setItem('access_token', googleAuthData.token);
                    localStorage.setItem('refresh_token', googleAuthData.refreshToken);
                    localStorage.setItem('user', JSON.stringify(googleAuthData.user));
                    
                    console.log('✅ Datos guardados en localStorage');
                    console.log('Token:', googleAuthData.token.substring(0, 20) + '...');
                    console.log('Usuario:', googleAuthData.user.username);
                    
                    // ✅ CORREGIDO: Redirigir a la ruta correcta con un delay más corto
                    setTimeout(() => {
                        console.log('🔄 Redirigiendo a la aplicación...');
                        window.location.href = 'http://localhost:8080/#/user-home';
                    }, 1500);
                    
                } catch (error) {
                    console.error('❌ Error guardando datos:', error);
                    alert('Error guardando datos de autenticación');
                    window.location.href = 'http://localhost:8080?error=storage_error';
                }
            </script>
        </body>
        </html>
        `;
        
        res.send(resultHtml);
        
    } catch (error: any) {
        console.error('Error en callback de Google:', error);
        res.redirect('http://localhost:8080?error=server_error');
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

export const googleAuthCtrl = async(req: Request, res: Response) =>{
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL;
    if (!redirectUri) {
        console.error(" ERROR: GOOGLE_OAUTH_REDIRECT_URL no està definida a .env");
        return res.status(500).json({ message: "Error interno de configuración" });
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = new URLSearchParams({
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
    });
    const fullUrl= `${rootUrl}?${options.toString()}`;
    console.log("Redireccionando a:", fullUrl); 
    res.redirect(fullUrl);
}
export const googleAuthTokenCtrl = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Falta el token de Google" });
    }

    try {
        // 1. Verificar token y obtener información del usuario desde Google
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

        const { email, name, sub: googleId, picture } = response.data;

// 2. Buscar usuario en base de datos
let user = await UserModel.findOne({ email });

        // 3. Si no existe, crear nuevo usuario
        if (!user) {
            user = await UserModel.create({
                email,
                username: name,
                googleId,
                profilePicture: picture,
                password: Math.random().toString(36).slice(-8), 
                role: "user",
                level: 1,
                totalDistance: 0,
                totalTime: 0,
                activities: [],
                achievements: [],
                challengesCompleted: [],
            });
        }

        // 4. Generar tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user.email);

        // 5. Save refresh token to user document
        user.refreshToken = refreshToken;
        await user.save();

        // 6. Return response
        return res.json({
            token: accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                level: user.level
            },
        });

    } catch (error) {
        console.error("Error al verificar token de Google:", error);
        return res.status(401).json({ message: "Token de Google inválido" });

    }
};