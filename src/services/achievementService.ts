import AchievementModel, {IAchievement} from '../models/achievement';


export const createAchievement = async(newAchievement: IAchievement)=> {
    return await AchievementModel.create(newAchievement);
};
export const getAchievementbyId = (achievementId: string) => {
    return AchievementModel.findById(achievementId)
    .populate("usersUnlocked", "username")
    .exec();
};  
export const getAllAchievement = async()=>{
    return await AchievementModel.find();
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