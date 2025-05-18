import pkg from "jsonwebtoken";
const { sign, verify } = pkg;

// Usamos secretos diferentes para cada tipo de token
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET; // Secret diferente

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
if (!REFRESH_SECRET) {
    throw new Error("REFRESH_SECRET is not defined in environment variables");
}

// Generamos el token de acceso con datos adicionales en el payload
const generateToken = (user: any) => {
  const jwt = sign({
    id: user._id?.toString() || user.id,
    role: user.role,
    name: user.username || user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    type: 'access',
  }, JWT_SECRET, { expiresIn: '15m' });

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