import ActivityModel from '../models/activity';
import UserModel from '../models/user';
import { 
    createActivity, 
    getActivityById,
    getActivitiesByUserId,
    getAllActivities,
    updateActivity, 
    deleteActivity, 
    //getActivitiesByUserIdPaginated
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
};

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
// Obtener actividades de usuarios seguidos (feed)
export const getFollowingActivitiesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`🔍 Getting following activities for user: ${userId}, page: ${page}, limit: ${limit}`);

    if (!userId) {
      res.status(400).json({ message: 'Se requiere ID de usuario' });
      return;
    }

    // Obtener los usuarios que sigue el usuario actual
    const user = await UserModel.findById(userId).select('following').lean();
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    console.log(`👥 User follows ${user.following?.length || 0} users`);

    // Si no sigue a nadie, devolver array vacío
    if (!user.following || user.following.length === 0) {
      res.status(200).json({
        activities: [],
        totalActivities: 0,
        totalPages: 0,
        currentPage: page,
        hasMore: false,
        followingCount: 0
      });
      return;
    }

    // Obtener actividades de los usuarios seguidos
    const skip = (page - 1) * limit;
    
    console.log(`📊 Querying activities from ${user.following.length} followed users...`);
    
    // ✅ CORREGIDO: Usar 'author' en lugar de 'user' y ajustar el populate
    const activities = await ActivityModel.find({
      author: { $in: user.following }
    })
    .populate('author', 'username profilePicture level email _id') // ✅ CORREGIDO: populate 'author' en lugar de 'user'
    .populate('route', 'name difficulty')
    .sort({ createdAt: -1 }) // Más recientes primero
    .skip(skip)
    .limit(limit)
    .lean();

    console.log(`📋 Found ${activities.length} activities`);

    // Contar total de actividades de seguidos
    const totalActivities = await ActivityModel.countDocuments({
      author: { $in: user.following }
    });

    const totalPages = Math.ceil(totalActivities / limit);
    const hasMore = page < totalPages;

    console.log(`📈 Total: ${totalActivities}, Pages: ${totalPages}, HasMore: ${hasMore}`);

    // ✅ NUEVO: Transformar los datos para que 'author' aparezca también como 'user' para el frontend
    const transformedActivities = activities.map(activity => {
      // If author is populated, it will be an object; otherwise, it's an ObjectId
      const authorObj = typeof activity.author === 'object' && activity.author !== null ? activity.author as { username?: string } : {};
      return {
        ...activity,
        user: activity.author,
        authorName: authorObj.username || 'Unknown User'
      };
    });

    res.status(200).json({
      activities: transformedActivities,
      totalActivities,
      totalPages,
      currentPage: page,
      hasMore,
      followingCount: user.following.length
    });

  } catch (error: any) {
    console.error('❌ Error al obtener actividades de seguidos:', error);
    res.status(500).json({ message: error.message });
  }
};