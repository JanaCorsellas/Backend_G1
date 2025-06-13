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
    // Usamos directamente el modelo y no las operaciones de MongoDB
    const achievements = await AchievementModel.find().sort({ difficulty: 1, targetValue: 1 });
    console.log(`Obteniendo todos los logros: ${achievements.length} encontrados`);
    return achievements;
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

    allAchievements.forEach(achievement => {
        if (achievement.usersUnlocked.some(id => id.toString() === userId)) {
            unlocked.push(achievement);
        } else {
            locked.push(achievement);
        }
    });

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
    try {
        const user = await UserModel.findById(userId).populate('activities');
        if (!user) {
            console.error(`No se encontró el usuario con ID: ${userId}`);
            return [];
        }

        const allAchievements = await getAllAchievements();
        const newlyUnlocked: IAchievement[] = [];
        
        console.log(`Verificando logros para usuario ${userId} (${user.username})`);
        console.log(`El usuario tiene ${user.achievements?.length || 0} logros desbloqueados previamente`);

        for (const achievement of allAchievements) {
            // Si ya está desbloqueado, continuar
            if (achievement.usersUnlocked.some(id => id.toString() === userId)) {
                continue;
            }

            const isUnlocked = await checkAchievementCondition(achievement, user);
            if (isUnlocked) {
                console.log(`Logro "${achievement.title}" cumple condiciones para el usuario ${userId}`);
                
                // Actualizamos el logro añadiendo al usuario a la lista de usersUnlocked
                await AchievementModel.findByIdAndUpdate(
                    achievement._id,
                    { $addToSet: { usersUnlocked: userId } }
                );

                // Actualizamos el usuario añadiendo el logro a su lista de achievements
                const updateResult = await UserModel.findByIdAndUpdate(
                    userId,
                    { $addToSet: { achievements: achievement._id } },
                    { new: true }
                );
                
                if (updateResult) {
                    console.log(`Usuario ${userId} actualizado con nuevo logro. Total logros: ${updateResult.achievements.length}`);
                } else {
                    console.error(`Error al actualizar logros del usuario ${userId}`);
                }

                newlyUnlocked.push(achievement);
                
                console.log(`Logro "${achievement.title}" desbloqueado para el usuario ${userId}`);
            }
        }

        // Verificación final para asegurar que los logros se guardaron
        const updatedUser = await UserModel.findById(userId);
        console.log(`Después de la verificación, el usuario tiene ${updatedUser?.achievements?.length || 0} logros`);

        return newlyUnlocked;
    } catch (error) {
        console.error('Error en checkAndUnlockAchievements:', error);
        return [];
    }
};

// Función para verificar si se cumple la condición de un logro
const checkAchievementCondition = async (achievement: IAchievement, user: any): Promise<boolean> => {
    try {
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
    } catch (error) {
        console.error('Error en checkAchievementCondition:', error);
        return false;
    }
};


// Inicializar logros generales de conteo de actividades
export const initializeGeneralAchievements = async (): Promise<IAchievement[]> => {
    try {
        console.log('Iniciando creación de logros generales...');
        const createdAchievements: IAchievement[] = [];

        const generalAchievements: Partial<IAchievement>[] = [
            // Primera actividad
            {
                title: "Primer Paso",
                description: "Completa tu primera actividad deportiva",
                condition: "Completar 1 actividad de cualquier tipo",
                icon: "directions_run",
                type: "activity_count",
                targetValue: 1,
                activityType: "all",
                difficulty: "bronze",
                points: 10,
                usersUnlocked: []
            },
            // Actividades totales
            {
                title: "Principiante",
                description: "Completa 5 actividades deportivas",
                condition: "Completar 5 actividades de cualquier tipo",
                icon: "directions_run",
                type: "activity_count",
                targetValue: 5,
                activityType: "all",
                difficulty: "bronze",
                points: 20,
                usersUnlocked: []
            },
            {
                title: "Deportista Regular",
                description: "Completa 25 actividades deportivas",
                condition: "Completar 25 actividades de cualquier tipo",
                icon: "directions_run",
                type: "activity_count",
                targetValue: 25,
                activityType: "all",
                difficulty: "silver",
                points: 50,
                usersUnlocked: []
            },
            {
                title: "Atleta Dedicado",
                description: "Completa 100 actividades deportivas",
                condition: "Completar 100 actividades de cualquier tipo",
                icon: "emoji_events",
                type: "activity_count",
                targetValue: 100,
                activityType: "all",
                difficulty: "gold",
                points: 150,
                usersUnlocked: []
            },
            {
                title: "Atleta Excepcional",
                description: "Completa 500 actividades deportivas",
                condition: "Completar 500 actividades de cualquier tipo",
                icon: "emoji_events",
                type: "activity_count",
                targetValue: 500,
                activityType: "all",
                difficulty: "diamond",
                points: 500,
                usersUnlocked: []
            },
        ];

        // Crear logros generales
        for (const achievement of generalAchievements) {
            try {
                const created = await AchievementModel.create(achievement);
                console.log(`Logro creado: ${created.title}`);
                createdAchievements.push(created);
            } catch (err) {
                console.error(`Error al crear logro ${achievement.title}:`, err);
            }
        }

        console.log(`Inicialización de logros generales completada. Creados ${createdAchievements.length} logros.`);
        return createdAchievements;
    } catch (error) {
        console.error("Error inicializando logros generales:", error);
        return [];
    }
};

// Inicializar logros de distancia total
export const initializeDistanceTotalAchievements = async (): Promise<IAchievement[]> => {
    try {
        console.log('Iniciando creación de logros de distancia total...');
        const createdAchievements: IAchievement[] = [];

        const distanceTotalAchievements: Partial<IAchievement>[] = [
            {
                title: "Primer Kilómetro",
                description: "Recorre un total de 1 kilómetro en tus actividades",
                condition: "Recorrer 1 km en total",
                icon: "directions_run",
                type: "distance_total",
                targetValue: 1000,
                activityType: "all",
                difficulty: "bronze",
                points: 10,
                usersUnlocked: []
            },
            {
                title: "5K Acumulados",
                description: "Recorre un total de 5 kilómetros en tus actividades",
                condition: "Recorrer 5 km en total",
                icon: "directions_run",
                type: "distance_total",
                targetValue: 5000,
                activityType: "all",
                difficulty: "bronze",
                points: 25,
                usersUnlocked: []
            },
            {
                title: "10K Acumulados",
                description: "Recorre un total de 10 kilómetros en tus actividades",
                condition: "Recorrer 10 km en total",
                icon: "directions_run",
                type: "distance_total",
                targetValue: 10000,
                activityType: "all",
                difficulty: "bronze",
                points: 30,
                usersUnlocked: []
            },
            {
                title: "21K Acumulados",
                description: "Recorre un total de 21 kilómetros en tus actividades",
                condition: "Recorrer 21 km en total (distancia de media maratón)",
                icon: "directions_run",
                type: "distance_total",
                targetValue: 21000,
                activityType: "all",
                difficulty: "silver",
                points: 50,
                usersUnlocked: []
            },
            {
                title: "Maratón Acumulada",
                description: "Recorre un total de 42 kilómetros en tus actividades",
                condition: "Recorrer 42 km en total (distancia de maratón)",
                icon: "emoji_events",
                type: "distance_total",
                targetValue: 42195,
                activityType: "all",
                difficulty: "silver",
                points: 75,
                usersUnlocked: []
            },
            {
                title: "Centurión",
                description: "Recorre un total de 100 kilómetros en tus actividades",
                condition: "Recorrer 100 km en total",
                icon: "emoji_events",
                type: "distance_total",
                targetValue: 100000,
                activityType: "all",
                difficulty: "gold",
                points: 100,
                usersUnlocked: []
            }
        ];

        // Crear logros de distancia total
        for (const achievement of distanceTotalAchievements) {
            try {
                const created = await AchievementModel.create(achievement);
                console.log(`Logro creado: ${created.title}`);
                createdAchievements.push(created);
            } catch (err) {
                console.error(`Error al crear logro ${achievement.title}:`, err);
            }
        }

        console.log(`Inicialización de logros de distancia total completada. Creados ${createdAchievements.length} logros.`);
        return createdAchievements;
    } catch (error) {
        console.error("Error inicializando logros de distancia total:", error);
        return [];
    }
};

// Inicializar logros de distancia individual
export const initializeDistanceSingleAchievements = async (): Promise<IAchievement[]> => {
    try {
        console.log('Iniciando creación de logros de distancia individual...');
        const createdAchievements: IAchievement[] = [];

        const distanceSingleAchievements: Partial<IAchievement>[] = [
            {
                title: "5K en Una Sesión",
                description: "Completa una actividad de 5 kilómetros",
                condition: "Recorrer 5 km en una sola actividad",
                icon: "directions_run",
                type: "distance_single",
                targetValue: 5000,
                activityType: "all",
                difficulty: "bronze",
                points: 30,
                usersUnlocked: []
            },
            {
                title: "10K en Una Sesión",
                description: "Completa una actividad de 10 kilómetros",
                condition: "Recorrer 10 km en una sola actividad",
                icon: "directions_run",
                type: "distance_single",
                targetValue: 10000,
                activityType: "all",
                difficulty: "silver",
                points: 50,
                usersUnlocked: []
            },
            {
                title: "Media Maratón",
                description: "Completa una actividad de 21 kilómetros",
                condition: "Recorrer 21 km en una sola actividad",
                icon: "emoji_events",
                type: "distance_single",
                targetValue: 21097,
                activityType: "all",
                difficulty: "gold",
                points: 100,
                usersUnlocked: []
            },
            {
                title: "Maratonista",
                description: "Completa una actividad de maratón (42.195 km)",
                condition: "Recorrer una maratón completa en una sola actividad",
                icon: "emoji_events",
                type: "distance_single",
                targetValue: 42195,
                activityType: "all",
                difficulty: "diamond",
                points: 250,
                usersUnlocked: []
            }
        ];

        // Crear logros de distancia individual
        for (const achievement of distanceSingleAchievements) {
            try {
                const created = await AchievementModel.create(achievement);
                console.log(`Logro creado: ${created.title}`);
                createdAchievements.push(created);
            } catch (err) {
                console.error(`Error al crear logro ${achievement.title}:`, err);
            }
        }

        console.log(`Inicialización de logros de distancia individual completada. Creados ${createdAchievements.length} logros.`);
        return createdAchievements;
    } catch (error) {
        console.error("Error inicializando logros de distancia individual:", error);
        return [];
    }
};

// Inicializar logros de actividades específicas
export const initializeActivitySpecificAchievements = async (): Promise<IAchievement[]> => {
    try {
        console.log('Iniciando creación de logros específicos por actividad...');
        const createdAchievements: IAchievement[] = [];

        const specificActivityAchievements: Partial<IAchievement>[] = [
            // Running
            {
                title: "Corredor Novato",
                description: "Completa 5 actividades de running",
                condition: "5 actividades de running",
                icon: "directions_run",
                type: "activity_count",
                targetValue: 5,
                activityType: "running",
                difficulty: "bronze",
                points: 25,
                usersUnlocked: []
            },
            {
                title: "Corredor Regular",
                description: "Completa 20 actividades de running",
                condition: "20 actividades de running",
                icon: "directions_run",
                type: "activity_count",
                targetValue: 20,
                activityType: "running",
                difficulty: "silver",
                points: 60,
                usersUnlocked: []
            },
            // Cycling
            {
                title: "Ciclista Novato",
                description: "Completa 5 actividades de ciclismo",
                condition: "5 actividades de ciclismo",
                icon: "directions_bike",
                type: "activity_count",
                targetValue: 5,
                activityType: "cycling",
                difficulty: "bronze",
                points: 25,
                usersUnlocked: []
            },
            {
                title: "Ciclista Regular",
                description: "Completa 20 actividades de ciclismo",
                condition: "20 actividades de ciclismo",
                icon: "directions_bike",
                type: "activity_count",
                targetValue: 20,
                activityType: "cycling",
                difficulty: "silver",
                points: 60,
                usersUnlocked: []
            },
            // Hiking
            {
                title: "Senderista Novato",
                description: "Completa 5 actividades de senderismo",
                condition: "5 actividades de senderismo",
                icon: "terrain",
                type: "activity_count",
                targetValue: 5,
                activityType: "hiking",
                difficulty: "bronze",
                points: 25,
                usersUnlocked: []
            }
        ];

        // Crear logros específicos por actividad
        for (const achievement of specificActivityAchievements) {
            try {
                const created = await AchievementModel.create(achievement);
                console.log(`Logro creado: ${created.title}`);
                createdAchievements.push(created);
            } catch (err) {
                console.error(`Error al crear logro ${achievement.title}:`, err);
            }
        }

        console.log(`Inicialización de logros específicos por actividad completada. Creados ${createdAchievements.length} logros.`);
        return createdAchievements;
    } catch (error) {
        console.error("Error inicializando logros específicos por actividad:", error);
        return [];
    }
};