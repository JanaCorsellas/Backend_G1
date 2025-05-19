import ChallengeModel, { IChallenge } from "../models/challenge";
import mongoose from 'mongoose';

export const createChallenge = async(newChallenge: IChallenge) => {
    return await ChallengeModel.create(newChallenge);
};

export const getChallengeById = async(challengeId: string)=>{
    return await ChallengeModel.findById(challengeId);
};

export const getChallenges = async (page: number, limit: number): Promise<{
  challenges: IChallenge[];
  totalChallenges: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error("La connexió a MongoDB no està disponible");
    }
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("La base de de dades no està disponible");
    }
    
    const collection = db.collection('challenges');
    
    const challenges = await collection.find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalChallenges = await collection.countDocuments(query);
    
    const totalPages = Math.ceil(totalChallenges / limit);
    
    console.log(`Trobats ${challenges.length} reptes d'un total de ${totalChallenges}`);
    
    return {
        challenges: challenges as unknown as IChallenge[],
        totalChallenges,
        totalPages,
        currentPage: page
    };
  } catch (error) {
    console.error('Error al obtenir reptes:', error);
    throw error;
  }
};

export const updateChallenge = async(challengeId: string, updatedChallenge: IChallenge)=>{
    return await ChallengeModel.findByIdAndUpdate(challengeId, updatedChallenge, {new: true});
};

export const deleteChallenge = async(challengeId: string)=>{
    return await ChallengeModel.findByIdAndDelete(challengeId);
};

export const getActiveChallenges = async()=>{
    return await ChallengeModel.find({endDate: {$gte: new Date()}});
};

export const getInactiveChallenges = async()=>{
    return await ChallengeModel.find({endDate: {$lte: new Date()}});
};