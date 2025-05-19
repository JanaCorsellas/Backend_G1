import { 
    createActivity, 
    getActivityById,
    //getActivitiesByUserId,
    getAllActivities,
    updateActivity, 
    deleteActivity, 
    getActivitiesByUserIdPaginated
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
/*
export const getActivitiesByUserIdController = async (req: Request, res: Response) => {
    try {
        // Obtenir pàgina i límit dels paràmetres de consulta
        const page = parseInt(req.query.page?.toString() || '1', 10);
        const limit = parseInt(req.query.limit?.toString() || '10', 10);
        console.log(`Sol·licitud d'activitats: pàgina ${page}, límit ${limit}`);

        //Obtenir activitats paginades
        const data = await getActivitiesByUserId(req.params.userId);
        res.json(data);
    }
    catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};*/
export const getActivitiesByUserIdController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page?.toString() || '1', 10);
    const limit = parseInt(req.query.limit?.toString() || '10', 10);
    const userId = req.params.userId;

    console.log(`Solicitando actividades del usuario ${userId}, página ${page}, límite ${limit}`);

    const data = await getActivitiesByUserIdPaginated(userId, page, limit);
    res.json(data);
  } catch (error: any) {
    console.error('Error al obtener actividades paginadas:', error);
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