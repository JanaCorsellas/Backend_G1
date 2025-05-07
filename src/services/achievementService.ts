import AchievementModel, {IAchievement} from '../models/achievement';
import mongoose from 'mongoose';

export const createAchievement = async(newAchievement: IAchievement)=> {
    return await AchievementModel.create(newAchievement);
};
export const getAchievementbyId = (achievementId: string) => {
    return AchievementModel.findById(achievementId)
    .populate("usersUnlocked", "username")
    .exec();
};  

export const getAchievements = async (page: number, limit: number): Promise<{
  achievements: IAchievement[];
  totalAchievements: number;
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
    
    const collection = db.collection('achievements');
    
    const achievements = await collection.find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalAchievements = await collection.countDocuments(query);
    
    const totalPages = Math.ceil(totalAchievements / limit);
    
    console.log(`Trobats ${achievements.length} assoliments d'un total de ${totalAchievements}`);
    
    return {
        achievements: achievements as unknown as IAchievement[],
        totalAchievements,
        totalPages,
        currentPage: page
    };
  } catch (error) {
    console.error('Error al obtenir assoliments:', error);
    throw error;
  }
};

export const updateAchievement = async(achievementId: string, updatedAchievement: IAchievement)=>{
    return await AchievementModel.findByIdAndUpdate(achievementId, updatedAchievement, {new: true});
};

export const deleteAchievement = async(achievementId: string)=>{
    return await AchievementModel.findByIdAndDelete(achievementId);
};

export const getAchievementByCondition = async(condition: string)=>{
    return await AchievementModel.find({condition: condition});
};

export const getAchievementByUser=async(userId: string)=>{
    return await AchievementModel.find({usersUnlocked: userId});
};

export const searchAchievements = async(searchText: string)=>{
    return await AchievementModel.find({name: {$regex: searchText, $options: 'i'}});
}