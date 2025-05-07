import { 
    createActivity, 
    getActivityById,
    getActivitiesByUserId,
    getAllActivities,
    updateActivity, 
    deleteActivity 
} from '../services/activityService';

import { Request, Response } from 'express';

// Crear una nova activitat
export const createActivityController = async (req: Request, res: Response) => {
    try {
        const data = await createActivity(req.body.author, req.body);
        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getActivityByIdController = async (req: Request, res: Response) => {
    try {
        const data = await getActivityById(req.params.id);
        res.json(data);
    }
    catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getActivitiesByUserIdController = async (req: Request, res: Response) => {
    try {
        const data = await getActivitiesByUserId(req.params.userId);
        res.json(data);
    }
    catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Obtenir totes les activitats
export const getActivitiesHandler = async (req: Request, res: Response) => {
    try {
        const data = await getAllActivities();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


// Actualitzar una activitat
export const updateActivityController = async (req: Request, res: Response) => {
    try {
        const data = await updateActivity(req.params.id, req.body);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar una activitat
export const deleteActivityController = async (req: Request, res: Response) => {
    try {
        const data = await deleteActivity(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
