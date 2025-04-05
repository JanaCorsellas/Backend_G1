import { Request, Response, NextFunction } from 'express';

export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Origin', req.header('origin') || 'localhost:4200');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        res.status(200).json({});
    } else {
        next();
    }
};
