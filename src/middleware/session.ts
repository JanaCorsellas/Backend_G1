import { Request, Response, NextFunction } from "express";
import { verifyToken, verifyRefreshToken, generateToken } from "../utils/jwt.handle";
import { JwtPayload } from "jsonwebtoken";
import User from "../models/user";

interface RequestExt extends Request {
    user?: string | JwtPayload;
}

export const checkJwt = async (
    req: RequestExt,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const jwtByUser = req.headers.authorization || null;
        const jwt = jwtByUser?.split(' ').pop();
        
        if (!jwt) {
            res.status(401).send("NO_TOKEN_PROVIDED");
            return;
        }
        
        const isUser = verifyToken(`${jwt}`);
        
        if (!isUser) {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            
            if (!refreshToken) {
                res.status(401).send("TOKEN_EXPIRED_NO_REFRESH");
                return;
            }
            
            const refreshPayload = verifyRefreshToken(refreshToken);
            if (!refreshPayload) {
                res.status(401).send("INVALID_REFRESH_TOKEN");
                return;
            }
            
            const email = (refreshPayload as any).id;
            const user = await User.findOne({ email });
            
            if (!user || user.refreshToken !== refreshToken) {
                res.status(401).send("INVALID_REFRESH_TOKEN");
                return;
            }
            
            const newToken = generateToken(user);
            req.user = { id: user.email, role: user.role, name: user.username };
            res.setHeader('Authorization', `Bearer ${newToken}`);
            next();
            return;
        }
        
        req.user = isUser;
        next();
    } catch (e) {
        console.error("Error en checkJwt:", e);
        res.status(401).send("SESSION_NO_VALID");
    }
};

export const checkRole = (roles: string[]) => {
    return async (
        req: RequestExt,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userRole = (req.user as any)?.role || 'user';
            
            if (!roles.includes(userRole)) {
                res.status(403).json({ 
                    message: 'No tienes permiso para acceder a este recurso' 
                });
                return;
            }
            
            next();
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al verificar permisos' 
            });
        }
    };
};