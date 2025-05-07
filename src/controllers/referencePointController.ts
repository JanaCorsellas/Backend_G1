import { 
    addReferencePoint, 
    getReferencePointById, 
    updateReferencePoint, 
    deleteReferencePoint 
} from '../services/referencePointService';

import { Request, Response } from 'express';

// Crear un nou punt de referència
export const addReferencePointController = async (req: Request, res: Response) => {
    try {
        if (!req.body){
            res.status(400).json({message: "Content can not be empty!"});
            return;
        }
        const { latitude, longitude, altitude } = req.body;
        if (!latitude || !longitude || !altitude) {
            res.status(400).json({message: "There are missing fields"});
            return;
        }
        const newPoint = await addReferencePoint(req.body);
        console.log("New reference point created:", newPoint);
        res.status(201).json({message: "New reference point created"});
    } catch (error: any) {
        console.log("Error creating reference point:", error);
        res.status(500).json({ message: error.message });
    }
};

// Obtenir un punt de referència per ID
export const getReferencePointByIdController = async (req: Request, res: Response) => {
    try {
        const getPoint = await getReferencePointById(req.params.id);
        if (!getPoint) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        console.log("Reference point obtained: ", getPoint);
        res.status(200).json(getPoint);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Actualitzar un punt de referència
export const updateReferencePointController = async (req: Request, res: Response) => {
    try {
        const updatePoint = await updateReferencePoint(req.params.id, req.body);
        if(!updatePoint){
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.status(200).json(updatePoint);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar un punt de referència
export const deleteReferencePointController = async (req: Request, res: Response) => {
    try {
        const data = await deleteReferencePoint(req.params.id);
        if(!data){
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};