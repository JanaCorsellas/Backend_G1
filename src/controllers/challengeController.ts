import {
    createChallenge,
    getChallengeById,
    getAllChallenges,
    updateChallenge,
    deleteChallenge,
    getActiveChallenges,
    getInactiveChallenges
} from "../services/challengeService";
import { Request,Response } from "express";

export const createChallengeController = async(req: Request, res: Response)=>{
    try{
        if(!req.body){
            res.status(400).json({message: "Los datos del challenge son requeridos"});
            return;
        }
        const { title, description, goalType, goalValue, reward, startDate, endDate } = req.body;
        if (!title || !description || !goalType || !goalValue || !reward || !startDate || !endDate) {
            res.status(400).json({ message: "Faltan campos requeridos" });
            return;
        }

        const newChallenge = await createChallenge(req.body);
        console.log("Challenge creado:", newChallenge);

        res.status(201).json({message: "Challenge creado exitosamente"});
    } catch (error) {
        console.error("Error al crear challenge:", error);
        res.status(500).json({message: "Error al crear el challenge", error});
    }
};

export const getChallengeByIdController = async(req: Request, res: Response)=>{
    try{
        const challengeId = await getChallengeById(req.params.id);

       if(!challengeId){
            res.status(404).json({message: "No se encontró el challenge"});
            return;
        }
        console.log("Challenge obtenido: ", challengeId);
        res.status(200).json(challengeId);
    } catch(error){
        res.status(500).json({message: "Error al obtener el challenge", error});
    }    
};

export const getAllChallengesController = async(req: Request, res: Response)=>{
    try{
        const challenges = await getAllChallenges();

        if(challenges.length === 0){
            res.status(404).json({message: "No se encontraron challenges"});
            return;
        }
        console.log("Challenge obtenidos: ", challenges);
        res.status(200).json({ message: "Challenges obtenidos exitosamente",
            total: challenges.length,
            challenges: challenges
        });
    } catch (error) {
        console.error("Error al obtener challenges:", error);
        res.status(500).json({message: "Error al obtener los challenges", error});
    }
};

export const getActiveChallengesController = async(req: Request, res: Response)=>{
    try{
        const activeChallenges = await getActiveChallenges();
        console.log("Challenge activos: ", activeChallenges);
        res.status(200).json({message: "Challenges activos obtenidos con éxito",challenges: activeChallenges});
    } catch(error){
        res.status(500).json({message: "Error al obtener los challenges activos", error});
        console.log("Error al obtener los challenges activos", error);
    }
};

export const getInactiveChallengesController = async(req: Request, res: Response)=>{
    try{
        const inactiveChallenges = await getInactiveChallenges();
        console.log("Challenge inactivos: ", inactiveChallenges);
    } catch(error){
        res.status(500).json({message: "Error al obtener los challenges inactivos", error});
        console.log("Error al obtener los challenges inactivos", error);
    }
};

export const updateChallengeController = async(req: Request, res: Response)=>{
    try{
        const update = await updateChallenge(req.params.id, req.body);

        if(!update){
            res.status(404).json({message: "No se encontró el challenge"});
            return;
        }
        res.status(200).json(update);
    } catch(error){
        res.status(500).json({message: "Error al actualizar el challenge", error});
    }
};

export const deleteChallengeController = async(req: Request, res: Response)=>{
    try{
        await deleteChallenge(req.params.id);
        res.status(200).json({message: "Challenge eliminado exitosamente"});
    } catch(error){
        res.status(500).json({message: "Error al eliminar el challenge", error});
    }
};