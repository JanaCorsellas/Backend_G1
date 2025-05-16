import pkg from "jsonwebtoken";
const { sign, verify } = pkg;
// Usamos secretos diferentes para cada tipo de token
const JWT_SECRET = process.env.JWT_SECRET || "token.a7a8c3e5f7b9d2e3a1c8b7e5f7a9c2e4a8c7b5e3f7a9";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh.c8b7e5f7a9c2e4a8c7b5e3f7a9c2e4a8c7b5e3f7a9"; // Secret diferente

// Generamos el token de acceso con datos adicionales en el payload
const generateToken = (id: string, role: string = "user", name: string = "") => {
    // Añadimos el rol y el nombre al payload
    const jwt = sign({ id, role, name, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
    return jwt;
};

// Generamos el refresh token con una duración más larga y un payload diferente
const generateRefreshToken = (id: string) => {
    // Payload más simple y secreto diferente
    const refreshToken = sign({ id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });
    return refreshToken;
};

// Verificamos el token de acceso
const verifyToken = (jwt: string) => {
    try {
        const isOk = verify(jwt, JWT_SECRET);
        return isOk;
    } catch (error) {
        return null;
    }
};

// Verificamos el refresh token con su propio secreto
const verifyRefreshToken = (refreshToken: string) => {
    try {
        const payload = verify(refreshToken, REFRESH_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
};

export { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };