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
            usersUnlocked: req.body.usersUnlocked
        };
        if (!newAchievement.title || !newAchievement.description || 
            !newAchievement.condition || !newAchievement.icon || 
            !newAchievement.usersUnlocked) {
            res.status(400).json({ message: "Todos los campos son requeridos"});
            return;
        }

        const createdAchievement = await achievementService.createAchievement(req.body);
        console.log("Logro creado:", createdAchievement);

        res.status(201).json({message: "Logro creado exitosamente"});
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

/**
 * Obtenir tots els assoliments
 */
export const getAchievementsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtenir pàgina i límit dels paràmetres de consulta
    const page = parseInt(req.query.page?.toString() || '1', 10);
    const limit = parseInt(req.query.limit?.toString() || '10', 10);
    
    console.log(`Sol·licitud d'assoliments: pàgina ${page}, límit ${limit}`);
    
    // Validar paràmetres de paginació
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ message: 'Paràmetres de paginació invàlids' });
      return;
    }
    
    // Obtenir assoliments paginats
    const result = await achievementService.getAchievements(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtenir assoliments:', error);
    res.status(500).json({ message: 'Error al obtenir assoliments' });
  }
};

export const updateAchievementHandler = async(req: Request, res: Response)=>{
    try{
        const updatedAchievement = await achievementService.updateAchievement(req.params.id, req.body);

        if(!updatedAchievement){
            res.status(404).json({message: "No s'ha trobat l'achievement'"});
        }
        res.status(200).json(updatedAchievement);
    } catch(error){
        res.status(500).json({message: "Error al actualitzar el achievement", error});
    }
};

export const deleteAchievementHandler = async(req: Request, res: Response)=>{
    try{
        await achievementService.deleteAchievement(req.params.id);
        res.status(200).json({message: "Achievement eliminat amb èxit"});
    } catch(error){
        res.status(500).json({message: "Error al eliminar el achievement", error});
    }
};
