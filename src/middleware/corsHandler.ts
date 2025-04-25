import { Request, Response, NextFunction } from 'express';

export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
    // Get the origin from the request headers or use a default value
    const origin = req.header('origin') || '*';
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).json({});
    } else {
        next();
    }
};