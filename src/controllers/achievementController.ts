import { Request,Response } from "express";
import * as achievementService from '../services/achievementService';
import { IAchievement } from "../models/achievement";

export const createAchievementHandler = async(req: Request, res: Response)=>{
    try{
        if(!req.body){
            res.status(400).json({message: "Los datos del logro son requeridos"});
            return;
        }
        const newAchievement: IAchievement = {
            title: req.body.title,
            description: req.body.description,
            condition: req.body.condition,
            icon: req.body.icon,
            usersUnlocked: req.body.usersUnlocked || [],
            type: req.body.type,
            targetValue: req.body.targetValue,
            activityType: req.body.activityType || 'all',
            difficulty: req.body.difficulty,
            points: req.body.points || 10
        };
        
        if (!newAchievement.title || !newAchievement.description || 
            !newAchievement.condition || !newAchievement.icon || 
            !newAchievement.type || !newAchievement.targetValue ||
            !newAchievement.difficulty) {
            res.status(400).json({ message: "Todos los campos requeridos deben estar presentes"});
            return;
        }

        const createdAchievement = await achievementService.createAchievement(newAchievement);
        console.log("Logro creado:", createdAchievement);

        res.status(201).json({
            message: "Logro creado exitosamente",
            achievement: createdAchievement
        });
    } catch (error) {
        console.error("Error al crear el logro:", error);
        res.status(500).json({message: "Error al crear el logro", error});
    }
};

export const getAchievementbyIdHandler = async(req: Request, res: Response)=>{
    try{
        const achievementId = await achievementService.getAchievementbyId(req.params.id);

       if(!achievementId){
            res.status(404).json({message: "No s'ha trobat cap achievement."});
            return;
        }
        console.log("Logro obtenido: ", achievementId);
        res.status(200).json(achievementId);
    } catch(error){
        res.status(500).json({message: "Error a l'obtenir l'achievement", error});
    }    
};

export const getAchievementsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page?.toString() || '1', 10);
    const limit = parseInt(req.query.limit?.toString() || '50', 10);
    
    console.log(`Sol·licitud d'assoliments: pàgina ${page}, límit ${limit}`);
    
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ message: 'Paràmetres de paginació invàlids' });
      return;
    }
    
    const result = await achievementService.getAchievements(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtenir assoliments:', error);
    res.status(500).json({ message: 'Error al obtenir assoliments' });
  }
};

export const getAllAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Obtener todos los logros
        const achievements = await achievementService.getAllAchievements();
        
        console.log(`Obtenidos ${achievements.length} logros en total`);
        
        // Esta es la respuesta que se envía al Swagger
        res.status(200).json({
            message: "Logros obtenidos exitosamente",
            achievements: achievements, // Asegúrate de que esto es un array con los logros reales
            total: achievements.length
        });
    } catch (error) {
        console.error('Error al obtener todos los logros:', error);
        res.status(500).json({ message: 'Error al obtener logros' });
    }
};

export const getUserAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ message: "ID de usuario requerido" });
            return;
        }

        const userAchievements = await achievementService.getUserAchievements(userId);
        
        console.log(`Usuario ${userId} tiene ${userAchievements.unlocked.length} logros desbloqueados de ${userAchievements.totalCount} totales`);
        
        res.status(200).json({
            message: "Logros del usuario obtenidos exitosamente",
            data: userAchievements
        });
    } catch (error) {
        console.error('Error al obtener logros del usuario:', error);
        res.status(500).json({ message: 'Error al obtener logros del usuario' });
    }
};

export const checkUserAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ message: "ID de usuario requerido" });
            return;
        }

        const newlyUnlocked = await achievementService.checkAndUnlockAchievements(userId);
        
        console.log(`Se verificaron logros para usuario ${userId}. Nuevos logros desbloqueados: ${newlyUnlocked.length}`);
        
        res.status(200).json({
            message: "Verificación de logros completada",
            newlyUnlocked,
            count: newlyUnlocked.length
        });
    } catch (error) {
        console.error('Error al verificar logros:', error);
        res.status(500).json({ message: 'Error al verificar logros' });
    }
};

export const initializeAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Iniciando el proceso de inicialización de logros por defecto desde el controlador");
        
        // Llamamos al servicio que inicializa los logros por defecto
        const createdAchievements = await achievementService.initializeGeneralAchievements();
        
        console.log(`Inicialización completada. Logros creados: ${createdAchievements.length}`);
        
        // Enviamos la respuesta con los logros creados
        res.status(200).json({
            message: "Logros por defecto inicializados exitosamente",
            count: createdAchievements.length
        });
    } catch (error) {
        console.error('Error al inicializar logros:', error);
        res.status(500).json({ message: 'Error al inicializar logros' });
    }
};

// Inicializar logros generales
export const initializeGeneralAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Iniciando la inicialización de logros generales");
        const createdAchievements = await achievementService.initializeGeneralAchievements();
        
        res.status(200).json({
            message: "Logros generales inicializados exitosamente",
            count: createdAchievements.length
        });
    } catch (error) {
        console.error('Error al inicializar logros generales:', error);
        res.status(500).json({ message: 'Error al inicializar logros generales' });
    }
};

// Inicializar logros de distancia total
export const initializeDistanceTotalAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Iniciando la inicialización de logros de distancia total");
        const createdAchievements = await achievementService.initializeDistanceTotalAchievements();
        
        res.status(200).json({
            message: "Logros de distancia total inicializados exitosamente",
            count: createdAchievements.length
        });
    } catch (error) {
        console.error('Error al inicializar logros de distancia total:', error);
        res.status(500).json({ message: 'Error al inicializar logros de distancia total' });
    }
};

// Inicializar logros de distancia individual
export const initializeDistanceSingleAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Iniciando la inicialización de logros de distancia individual");
        const createdAchievements = await achievementService.initializeDistanceSingleAchievements();
        
        res.status(200).json({
            message: "Logros de distancia individual inicializados exitosamente",
            count: createdAchievements.length
        });
    } catch (error) {
        console.error('Error al inicializar logros de distancia individual:', error);
        res.status(500).json({ message: 'Error al inicializar logros de distancia individual' });
    }
};

// Inicializar logros específicos por actividad
export const initializeActivitySpecificAchievementsController = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Iniciando la inicialización de logros específicos por actividad");
        const createdAchievements = await achievementService.initializeActivitySpecificAchievements();
        
        res.status(200).json({
            message: "Logros específicos por actividad inicializados exitosamente",
            count: createdAchievements.length
        });
    } catch (error) {
        console.error('Error al inicializar logros específicos por actividad:', error);
        res.status(500).json({ message: 'Error al inicializar logros específicos por actividad' });
    }
};

export const updateAchievementHandler = async(req: Request, res: Response)=>{
    try{
        const updatedAchievement = await achievementService.updateAchievement(req.params.id, req.body);

        if(!updatedAchievement){
            res.status(404).json({message: "No s'ha trobat l'achievement'"});
            return;
        }
        res.status(200).json({
            message: "Logro actualizado exitosamente",
            achievement: updatedAchievement
        });
    } catch(error){
        res.status(500).json({message: "Error al actualitzar el achievement", error});
    }
};

export const deleteAchievementHandler = async(req: Request, res: Response)=>{
    try{
        const deleted = await achievementService.deleteAchievement(req.params.id);
        if (!deleted) {
            res.status(404).json({message: "Logro no encontrado"});
            return;
        }
        res.status(200).json({message: "Achievement eliminat amb èxit"});
    } catch(error){
        res.status(500).json({message: "Error al eliminar el achievement", error});
    }
};