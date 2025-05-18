import AchievementModel, {IAchievement} from '../models/achievement';
import UserModel from '../models/user';
import ActivityModel from '../models/activity';
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
      .sort({ difficulty: 1, targetValue: 1 })
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

export const getAllAchievements = async (): Promise<IAchievement[]> => {
    return await AchievementModel.find().sort({ difficulty: 1, targetValue: 1 });
};

export const getUserAchievements = async (userId: string): Promise<{
    unlocked: IAchievement[];
    locked: IAchievement[];
    totalCount: number;
    unlockedCount: number;
}> => {
    const allAchievements = await getAllAchievements();
    const unlocked: IAchievement[] = [];
    const locked: IAchievement[] = [];

    // Convertir userId a ObjectId para comparación correcta
    const userObjectId = new mongoose.Types.ObjectId(userId);

    allAchievements.forEach(achievement => {
        // Mejorar la comparación usando ObjectId
        const isUnlocked = achievement.usersUnlocked.some(id => {
            // Comparar tanto como string como ObjectId
            return id.toString() === userId || id.equals(userObjectId);
        });

        if (isUnlocked) {
            unlocked.push(achievement);
        } else {
            locked.push(achievement);
        }
    });

    console.log(`Usuario ${userId}: ${unlocked.length} desbloqueados, ${locked.length} bloqueados de ${allAchievements.length} totales`);

    return {
        unlocked,
        locked,
        totalCount: allAchievements.length,
        unlockedCount: unlocked.length
    };
};

export const updateAchievement = async(achievementId: string, updatedAchievement: Partial<IAchievement>)=>{
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
    return await AchievementModel.find({title: {$regex: searchText, $options: 'i'}});
};

// Función para verificar y desbloquear logros automáticamente
export const checkAndUnlockAchievements = async (userId: string): Promise<IAchievement[]> => {
    const user = await UserModel.findById(userId).populate('activities');
    if (!user) return [];

    const allAchievements = await getAllAchievements();
    const newlyUnlocked: IAchievement[] = [];

    for (const achievement of allAchievements) {
        // Si ya está desbloqueado, continuar
        if (achievement.usersUnlocked.some(id => id.toString() === userId)) {
            continue;
        }

        const isUnlocked = await checkAchievementCondition(achievement, user);
        if (isUnlocked) {
            await AchievementModel.findByIdAndUpdate(
                achievement._id,
                { $addToSet: { usersUnlocked: userId } }
            );
            newlyUnlocked.push(achievement);
        }
    }

    return newlyUnlocked;
};

// Función para verificar si se cumple la condición de un logro
const checkAchievementCondition = async (achievement: IAchievement, user: any): Promise<boolean> => {
    const activities = await ActivityModel.find({ author: user._id });

    switch (achievement.type) {
        case 'distance_total':
            return user.totalDistance >= achievement.targetValue;

        case 'distance_single':
            return activities.some(activity => {
                if (achievement.activityType !== 'all' && activity.type !== achievement.activityType) {
                    return false;
                }
                return activity.distance >= achievement.targetValue;
            });

        case 'time_total':
            return user.totalTime >= achievement.targetValue;

        case 'time_single':
            return activities.some(activity => {
                if (achievement.activityType !== 'all' && activity.type !== achievement.activityType) {
                    return false;
                }
                return activity.duration >= achievement.targetValue;
            });

        case 'time_monthly':
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyActivities = activities.filter(activity => {
                const activityDate = new Date(activity.startTime);
                return activityDate.getMonth() === currentMonth && 
                       activityDate.getFullYear() === currentYear;
            });
            const monthlyTime = monthlyActivities.reduce((total, activity) => total + activity.duration, 0);
            return monthlyTime >= achievement.targetValue;

        case 'time_yearly':
            const currentYearActivities = activities.filter(activity => {
                const activityDate = new Date(activity.startTime);
                return activityDate.getFullYear() === currentYear;
            });
            const yearlyTime = currentYearActivities.reduce((total, activity) => total + activity.duration, 0);
            return yearlyTime >= achievement.targetValue;

        case 'activity_count':
            if (achievement.activityType === 'all') {
                return activities.length >= achievement.targetValue;
            } else {
                const typeActivities = activities.filter(activity => activity.type === achievement.activityType);
                return typeActivities.length >= achievement.targetValue;
            }

        case 'speed_average':
            const speedActivities = activities.filter(activity => {
                if (achievement.activityType !== 'all' && activity.type !== achievement.activityType) {
                    return false;
                }
                return true;
            });
            if (speedActivities.length === 0) return false;
            const averageSpeed = speedActivities.reduce((total, activity) => total + activity.averageSpeed, 0) / speedActivities.length;
            return averageSpeed >= achievement.targetValue;

        case 'elevation_gain':
            return activities.some(activity => {
                if (achievement.activityType !== 'all' && activity.type !== achievement.activityType) {
                    return false;
                }
                return activity.elevationGain >= achievement.targetValue;
            });

        case 'consecutive_days':
            // Implementar lógica para días consecutivos
            const sortedActivities = activities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            let consecutiveDays = 0;
            let currentDate = new Date();
            
            for (let i = 0; i < achievement.targetValue; i++) {
                const checkDate = new Date(currentDate);
                checkDate.setDate(checkDate.getDate() - i);
                
                const hasActivityOnDate = sortedActivities.some(activity => {
                    const activityDate = new Date(activity.startTime);
                    return activityDate.toDateString() === checkDate.toDateString();
                });
                
                if (hasActivityOnDate) {
                    consecutiveDays++;
                } else {
                    break;
                }
            }
            
            return consecutiveDays >= achievement.targetValue;

        default:
            return false;
    }
};

// Función para inicializar logros por defecto
export const initializeDefaultAchievements = async (): Promise<void> => {
    const existingCount = await AchievementModel.countDocuments();
    if (existingCount > 0) return; // Ya hay logros, no inicializar

    const defaultAchievements: Partial<IAchievement>[] = [
        // Logros de distancia total
        {
            title: "Primer Paso",
            description: "Completa tu primera actividad",
            condition: "Completa 1 actividad",
            icon: "directions_run",
            type: "activity_count",
            targetValue: 1,
            activityType: "all",
            difficulty: "bronze",
            points: 10
        },
        {
            title: "Primer Kilómetro",
            description: "Recorre tu primer kilómetro",
            condition: "Recorre 1 km en total",
            icon: "directions_run",
            type: "distance_total",
            targetValue: 1000,
            activityType: "all",
            difficulty: "bronze",
            points: 10
        },
        {
            title: "5K Runner",
            description: "Recorre 5 kilómetros en total",
            condition: "Recorre 5 km en total",
            icon: "directions_run",
            type: "distance_total",
            targetValue: 5000,
            activityType: "all",
            difficulty: "bronze",
            points: 25
        },
        {
            title: "10K Warrior",
            description: "Recorre 10 kilómetros en total",
            condition: "Recorre 10 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 10000,
            activityType: "all",
            difficulty: "silver",
            points: 50
        },
        {
            title: "Maratonista",
            description: "Recorre 42.195 kilómetros en una sola actividad",
            condition: "Recorre 42.195 km en una actividad",
            icon: "emoji_events",
            type: "distance_single",
            targetValue: 42195,
            activityType: "running",
            difficulty: "gold",
            points: 200
        },
        {
            title: "Centurión",
            description: "Recorre 100 kilómetros en total",
            condition: "Recorre 100 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 100000,
            activityType: "all",
            difficulty: "gold",
            points: 100
        },
        {
            title: "Ultradistancia",
            description: "Recorre 1000 kilómetros en total",
            condition: "Recorre 1000 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 1000000,
            activityType: "all",
            difficulty: "diamond",
            points: 500
        },

        // Logros de tiempo
        {
            title: "Primer Sprint",
            description: "Completa una actividad de 10 minutos",
            condition: "Actividad de 10 minutos",
            icon: "timer",
            type: "time_single",
            targetValue: 10,
            activityType: "all",
            difficulty: "bronze",
            points: 10
        },
        {
            title: "Media Hora",
            description: "Completa una actividad de 30 minutos",
            condition: "Actividad de 30 minutos",
            icon: "timer",
            type: "time_single",
            targetValue: 30,
            activityType: "all",
            difficulty: "bronze",
            points: 25
        },
        {
            title: "Una Hora Completa",
            description: "Completa una actividad de 1 hora",
            condition: "Actividad de 1 hora",
            icon: "timer",
            type: "time_single",
            targetValue: 60,
            activityType: "all",
            difficulty: "silver",
            points: 50
        },
        {
            title: "Resistencia Mensual",
            description: "Acumula 10 horas de actividad en un mes",
            condition: "10 horas en un mes",
            icon: "timer",
            type: "time_monthly",
            targetValue: 600,
            activityType: "all",
            difficulty: "silver",
            points: 75
        },
        {
            title: "Atleta Anual",
            description: "Acumula 100 horas de actividad en un año",
            condition: "100 horas en un año",
            icon: "timer",
            type: "time_yearly",
            targetValue: 6000,
            activityType: "all",
            difficulty: "gold",
            points: 200
        },

        // Logros de velocidad
        {
            title: "Velocista",
            description: "Mantén una velocidad promedio de 15 km/h",
            condition: "Velocidad promedio de 15 km/h",
            icon: "speed",
            type: "speed_average",
            targetValue: 4.17,
            activityType: "running",
            difficulty: "silver",
            points: 50
        },

        // Logros de elevación
        {
            title: "Escalador",
            description: "Gana 500m de elevación en una actividad",
            condition: "500m de elevación en una actividad",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 500,
            activityType: "all",
            difficulty: "silver",
            points: 75
        },

        // Logros de consistencia
        {
            title: "Constancia",
            description: "Realiza actividad 3 días consecutivos",
            condition: "3 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 3,
            activityType: "all",
            difficulty: "silver",
            points: 50
        },
        {
            title: "Disciplina",
            description: "Realiza actividad 7 días consecutivos",
            condition: "7 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 7,
            activityType: "all",
            difficulty: "gold",
            points: 100
        },

        // Logros específicos por actividad
        {
            title: "Ciclista",
            description: "Completa 10 actividades de ciclismo",
            condition: "10 actividades de ciclismo",
            icon: "directions_bike",
            type: "activity_count",
            targetValue: 10,
            activityType: "cycling",
            difficulty: "silver",
            points: 50
        },
        {
            title: "Senderista",
            description: "Completa 10 actividades de senderismo",
            condition: "10 actividades de senderismo",
            icon: "terrain",
            type: "activity_count",
            targetValue: 10,
            activityType: "hiking",
            difficulty: "silver",
            points: 50
        }
    ];

    for (const achievement of defaultAchievements) {
        try {
            await AchievementModel.create(achievement);
            console.log(`Created achievement: ${achievement.title}`);
        } catch (error) {
            console.error(`Error creating achievement ${achievement.title}:`, error);
        }
    }

    console.log('Default achievements initialized');
};