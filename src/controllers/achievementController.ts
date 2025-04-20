import { Request,Response } from "express";
import * as achievementService from '../services/achievementService';
import { IAchievement } from "../models/achievement";

export const createAchievementController = async(req: Request, res: Response)=>{
    try{
        if(!req.body){
            res.status(400).json({message: "Los datos del logro son requeridos"});
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
        }

        const createdAchievement = await achievementService.createAchievement(req.body);
        console.log("Logro creado:", createdAchievement);

        res.status(201).json({message: "Logro creado exitosamente"});
    } catch (error) {
        console.error("Error al crear el logro:", error);
        res.status(500).json({message: "Error al crear el logro", error});
    }
};

export const getAchievementbyIdController = async(req: Request, res: Response)=>{
    try{
        const achievementId = await achievementService.getAchievementbyId(req.params.id);

       if(!achievementId){
            res.status(404).json({message: "No se encontró el logro"});
        }
        console.log("Logro obtenido: ", achievementId);
        res.status(200).json(achievementId);
    } catch(error){
        res.status(500).json({message: "Error al obtener el logro", error});
    }    
};

export const getAllAchievementController = async(req: Request, res: Response)=>{
    try{
        const achievements = await achievementService.getAllAchievement();

        if(achievements.length === 0){
            res.status(404).json({message: "No se encontraron logros"});
        }
        console.log("Logros obtenidos: ", achievements);
        res.status(200).json({ message: "Logros obtenidos exitosamente",
            total: achievements.length,
            achievement: achievements
        });
    } catch (error) {
        console.error("Error al obtener los logros:", error);
        res.status(500).json({message: "Error al obtener los logrso", error});
    }
};

export const updateAchievementController = async(req: Request, res: Response)=>{
    try{
        const updatedAchievement = await achievementService.updateAchievement(req.params.id, req.body);

        if(!updatedAchievement){
            res.status(404).json({message: "No se encontró el logro"});
        }
        res.status(200).json(updatedAchievement);
    } catch(error){
        res.status(500).json({message: "Error al actualizar el logro", error});
    }
};

export const deleteAchievementController = async(req: Request, res: Response)=>{
    try{
        await achievementService.deleteAchievement(req.params.id);
        res.status(200).json({message: "Logro eliminado exitosamente"});
    } catch(error){
        res.status(500).json({message: "Error al eliminar el logro", error});
    }
};
