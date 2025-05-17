import { encrypt, verified } from "../utils/bcrypt.handle";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.handle";
import User, { IUser } from "../models/user";
import { Auth } from "../models/auth_model";
import axios from 'axios';

/**
 * Registra un nuevo usuario en el sistema
 */
const registerNewUser = async (userData: { username: string; email: string; password: string }) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) return "ALREADY_USER";

    const passHash = await encrypt(userData.password);

    const newUser = await User.create({
        username: userData.username,
        email: userData.email,
        password: passHash,
        role: "user",
        level: 1,
        totalDistance: 0,
        totalTime: 0,
        activities: [],
        achievements: [],
        challengesCompleted: [],
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const token = generateToken(newUser.email, newUser.role, newUser.username);
    const refreshToken = generateRefreshToken(newUser.email);
    
    // Verificamos que los tokens sean diferentes
    console.log("Access token generado:", token.substring(0, 20) + '...');
    console.log("Refresh token generado:", refreshToken.substring(0, 20) + '...');
    console.log("¿Son diferentes?", token !== refreshToken ? "Sí" : "No");
    
    await User.updateOne({ email: newUser.email }, { refreshToken });

    return {
        token,
        refreshToken,
        user: newUser
    };
};

/**
 * Autenticación de usuario mediante email y contraseña
 */
const loginUser = async ({ email, password, username }: Auth) => {
    // Verificamos si el usuario existe
    const checkIs = await User.findOne({ email });
    if(!checkIs) return "NOT_FOUND_USER";

    // Verificamos la contraseña
    const passwordHash = checkIs.password;
    const isCorrect = await verified(password, passwordHash);
    if(!isCorrect) return "INCORRECT_PASSWORD";

    // Generamos un token de acceso con datos enriquecidos
    const token = generateToken(checkIs.email, checkIs.role, checkIs.username);
    
    // Generamos un refresh token
    const refreshToken = generateRefreshToken(checkIs.email);
    
    // Verificamos que los tokens sean diferentes
    console.log("Access token generado:", token.substring(0, 20) + '...');
    console.log("Refresh token generado:", refreshToken.substring(0, 20) + '...');
    console.log("¿Son diferentes?", token !== refreshToken ? "Sí" : "No");
    
    // Guardamos el refresh token en la base de datos
    await User.updateOne({ email }, { refreshToken });

    // Devolvemos los tokens y los datos del usuario
    const data = {
        token,
        refreshToken,
        user: checkIs
    }
    return data;
};

/**
 * Refresca un token de acceso utilizando un refresh token
 */
const refreshUserToken = async (refreshToken: string) => {
    // Verificamos que el refresh token sea válido
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return "INVALID_REFRESH_TOKEN";
    
    // Obtenemos el ID del usuario del payload
    const userId = (payload as any).id;
    
    // Buscamos al usuario en la base de datos
    const user = await User.findOne({ email: userId });
    if (!user) return "USER_NOT_FOUND";
    
    // Verificamos que el refresh token coincida con el almacenado
    if (user.refreshToken !== refreshToken) return "REFRESH_TOKEN_MISMATCH";
    
    // Generamos un nuevo token de acceso
    const newToken = generateToken(user.email, user.role, user.username);
    
    // Generamos un nuevo refresh token (rotación de tokens)
    const newRefreshToken = generateRefreshToken(user.email);
    
    // Verificamos que son diferentes
    console.log("Nuevo access token generado:", newToken.substring(0, 20) + '...');
    console.log("Nuevo refresh token generado:", newRefreshToken.substring(0, 20) + '...');
    console.log("¿Son diferentes?", newToken !== newRefreshToken ? "Sí" : "No");
    
    // Actualizamos el refresh token en la base de datos
    await User.updateOne({ email: userId }, { refreshToken: newRefreshToken });
    
    // Devolvemos los nuevos tokens
    return {
        token: newToken,
        refreshToken: newRefreshToken
    };
};

/**
 * Cierra la sesión de un usuario invalidando su refresh token
 */
const logoutUser = async (userId: string) => {
    // Actualizamos el refresh token a null para invalidarlo
    await User.updateOne({ email: userId }, { refreshToken: null });
    return true;
};

/**
 * Autenticación mediante Google OAuth
 */
const googleAuth = async (code: string) => {
    try {
        // Verificamos que las variables de entorno estén configuradas
        console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
        console.log("Client Secret:", process.env.GOOGLE_CLIENT_SECRET);
        console.log("Redirect URI:", process.env.GOOGLE_OAUTH_REDIRECT_URL);
    
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_OAUTH_REDIRECT_URL) {
            throw new Error("Variables de entorno faltantes");
        }

        // Definimos la estructura de la respuesta de token
        interface TokenResponse {
            access_token: string;
            expires_in: number;
            scope: string;
            token_type: string;
            id_token?: string;
        }
        
        // Intercambiamos el código por un token de acceso de Google
        const tokenResponse = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code'
        });

        const access_token = tokenResponse.data.access_token;
        console.log("Google Access Token:", access_token.substring(0, 20) + '...'); 
        
        // Obtenemos el perfil del usuario
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            params: { access_token },
            headers: { Accept: 'application/json' },
        });

        // Procesamos los datos del perfil
        const profile = profileResponse.data as {name: string, email: string; id: string };
        console.log("Perfil de Google:", profile);
        
        // Buscamos o creamos el usuario en nuestra base de datos
        let user = await User.findOne({ 
            $or: [
                { username: profile.name },
                { email: profile.email }
            ] 
        });

        // Si el usuario no existe, lo creamos
        if (!user) {
            console.log("Creando nuevo usuario desde Google Auth");
            const randomPassword = Math.random().toString(36).slice(-8);
            const passHash = await encrypt(randomPassword);
            user = await User.create({
                username: profile.name,
                email: profile.email,
                googleId: profile.id,
                password: passHash,
                role: 'user', // Rol por defecto
                level: 1,
                totalDistance: 0,
                totalTime: 0,
                activities: [],
                achievements: [],
                challengesCompleted: []
            });
        } else {
            console.log("Usuario existente encontrado:", user.email);
        }

        // Generamos tokens JWT para nuestra aplicación
        const token = generateToken(user.email, user.role, user.username);
        const refreshToken = generateRefreshToken(user.email);
        
        // Verificamos que son diferentes
        console.log("Access token generado (Google):", token.substring(0, 20) + '...');
        console.log("Refresh token generado (Google):", refreshToken.substring(0, 20) + '...');
        console.log("¿Son diferentes?", token !== refreshToken ? "Sí" : "No");
        
        // Guardamos el refresh token en la base de datos
        await User.updateOne({ email: user.email }, { refreshToken });

        return { token, refreshToken, user };
    } catch (error: any) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        throw new Error('Error en autenticación con Google');
    }
};

export { registerNewUser, loginUser, refreshUserToken, logoutUser, googleAuth };