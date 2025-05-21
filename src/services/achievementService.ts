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
            // Actualizamos el logro añadiendo al usuario a la lista de usersUnlocked
            await AchievementModel.findByIdAndUpdate(
                achievement._id,
                { $addToSet: { usersUnlocked: userId } }
            );

            // Actualizamos el usuario añadiendo el logro a su lista de achievements
            await UserModel.findByIdAndUpdate(
                userId,
                { $addToSet: { achievements: achievement._id } }
            );

            newlyUnlocked.push(achievement);
            
            console.log(`Logro "${achievement.title}" desbloqueado para el usuario ${userId}`);
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
// Función para inicializar logros por defecto
export const initializeDefaultAchievements = async (): Promise<void> => {
    const existingCount = await AchievementModel.countDocuments();
    if (existingCount > 0) {
        console.log(`Ya existen ${existingCount} logros. No se inicializan los logros por defecto.`);
        return;
    }

    console.log('Iniciando creación de logros por defecto...');

    // ===== LOGROS GENERALES (para todos los tipos de actividad) =====
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
            points: 10
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
            points: 20
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
            points: 50
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
            points: 150
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
            points: 500
        },
    ];

    // ===== LOGROS DE DISTANCIA TOTAL =====
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
            points: 10
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
            points: 25
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
            points: 30
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
            points: 50
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
            points: 75
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
            points: 100
        },
        {
            title: "Doble Centurión",
            description: "Recorre un total de 200 kilómetros en tus actividades",
            condition: "Recorrer 200 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 200000,
            activityType: "all",
            difficulty: "gold",
            points: 150
        },
        {
            title: "Medio Millar",
            description: "Recorre un total de 500 kilómetros en tus actividades",
            condition: "Recorrer 500 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 500000,
            activityType: "all",
            difficulty: "gold",
            points: 250
        },
        {
            title: "Ultradistancia",
            description: "Recorre un total de 1000 kilómetros en tus actividades",
            condition: "Recorrer 1000 km en total",
            icon: "emoji_events",
            type: "distance_total",
            targetValue: 1000000,
            activityType: "all",
            difficulty: "diamond",
            points: 500
        },
        {
            title: "Vuelta a España",
            description: "Recorre un total de 3000 kilómetros en tus actividades",
            condition: "Recorrer 3000 km en total (aproximadamente el perímetro de España)",
            icon: "landscape",
            type: "distance_total",
            targetValue: 3000000,
            activityType: "all",
            difficulty: "diamond",
            points: 1000
        },
    ];

    // ===== LOGROS DE DISTANCIA INDIVIDUAL =====
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
            points: 30
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
            points: 50
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
            points: 100
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
            points: 250
        },
        // Específicos para correr
        {
            title: "Corredor de Distancia",
            description: "Completa una carrera de 15 kilómetros",
            condition: "Recorrer 15 km corriendo en una sola actividad",
            icon: "directions_run",
            type: "distance_single",
            targetValue: 15000,
            activityType: "running",
            difficulty: "silver",
            points: 75
        },
        // Específicos para ciclismo
        {
            title: "Ciclista de Ruta",
            description: "Completa un recorrido en bicicleta de 50 kilómetros",
            condition: "Recorrer 50 km en bicicleta en una sola actividad",
            icon: "directions_bike",
            type: "distance_single",
            targetValue: 50000,
            activityType: "cycling",
            difficulty: "silver",
            points: 75
        },
        {
            title: "Ciclista de Gran Fondo",
            description: "Completa un recorrido en bicicleta de 100 kilómetros",
            condition: "Recorrer 100 km en bicicleta en una sola actividad",
            icon: "directions_bike",
            type: "distance_single",
            targetValue: 100000,
            activityType: "cycling",
            difficulty: "gold",
            points: 150
        },
        // Específicos para senderismo
        {
            title: "Excursionista",
            description: "Completa una ruta de senderismo de 10 kilómetros",
            condition: "Recorrer 10 km haciendo senderismo en una sola actividad",
            icon: "terrain",
            type: "distance_single",
            targetValue: 10000,
            activityType: "hiking",
            difficulty: "silver",
            points: 50
        },
    ];

    // ===== LOGROS DE TIEMPO =====
    const timeAchievements: Partial<IAchievement>[] = [
        // Tiempo individual
        {
            title: "Primer Sprint",
            description: "Completa una actividad de 15 minutos",
            condition: "Actividad de 15 minutos",
            icon: "timer",
            type: "time_single",
            targetValue: 15,
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
            points: 20
        },
        {
            title: "Una Hora Completa",
            description: "Completa una actividad de 60 minutos",
            condition: "Actividad de 60 minutos",
            icon: "timer",
            type: "time_single",
            targetValue: 60,
            activityType: "all",
            difficulty: "silver",
            points: 40
        },
        {
            title: "Resistencia",
            description: "Completa una actividad de 2 horas",
            condition: "Actividad de 120 minutos",
            icon: "timer",
            type: "time_single",
            targetValue: 120,
            activityType: "all",
            difficulty: "gold",
            points: 80
        },
        // Tiempo total
        {
            title: "Principiante Dedicado",
            description: "Acumula 5 horas de actividad física",
            condition: "5 horas de actividad en total",
            icon: "timer",
            type: "time_total",
            targetValue: 300,
            activityType: "all",
            difficulty: "bronze",
            points: 30
        },
        {
            title: "Entusiasta",
            description: "Acumula 20 horas de actividad física",
            condition: "20 horas de actividad en total",
            icon: "timer",
            type: "time_total",
            targetValue: 1200,
            activityType: "all",
            difficulty: "silver",
            points: 60
        },
        {
            title: "Deportista Comprometido",
            description: "Acumula 50 horas de actividad física",
            condition: "50 horas de actividad en total",
            icon: "timer",
            type: "time_total",
            targetValue: 3000,
            activityType: "all",
            difficulty: "gold",
            points: 100
        },
        {
            title: "Atleta de Élite",
            description: "Acumula 100 horas de actividad física",
            condition: "100 horas de actividad en total",
            icon: "timer",
            type: "time_total",
            targetValue: 6000,
            activityType: "all",
            difficulty: "diamond",
            points: 200
        },
        // Tiempo mensual
        {
            title: "Activo este Mes",
            description: "Acumula 5 horas de actividad en un mes",
            condition: "5 horas en un mes",
            icon: "event_available",
            type: "time_monthly",
            targetValue: 300,
            activityType: "all",
            difficulty: "bronze",
            points: 40
        },
        {
            title: "Resistencia Mensual",
            description: "Acumula 10 horas de actividad en un mes",
            condition: "10 horas en un mes",
            icon: "event_available",
            type: "time_monthly",
            targetValue: 600,
            activityType: "all",
            difficulty: "silver",
            points: 75
        },
        {
            title: "Súper Activo este Mes",
            description: "Acumula 20 horas de actividad en un mes",
            condition: "20 horas en un mes",
            icon: "event_available",
            type: "time_monthly",
            targetValue: 1200,
            activityType: "all",
            difficulty: "gold",
            points: 120
        },
        // Tiempo anual
        {
            title: "Atleta Anual",
            description: "Acumula 100 horas de actividad en un año",
            condition: "100 horas en un año",
            icon: "event_available",
            type: "time_yearly",
            targetValue: 6000,
            activityType: "all",
            difficulty: "gold",
            points: 200
        },
        {
            title: "Atleta de Oro Anual",
            description: "Acumula 200 horas de actividad en un año",
            condition: "200 horas en un año",
            icon: "event_available",
            type: "time_yearly",
            targetValue: 12000,
            activityType: "all",
            difficulty: "diamond",
            points: 300
        },
    ];

    // ===== LOGROS DE VELOCIDAD =====
    const speedAchievements: Partial<IAchievement>[] = [
        // Correr
        {
            title: "Trote Ligero",
            description: "Mantén una velocidad promedio de 8 km/h corriendo",
            condition: "Velocidad promedio de 8 km/h corriendo",
            icon: "speed",
            type: "speed_average",
            targetValue: 2.22, // m/s
            activityType: "running",
            difficulty: "bronze",
            points: 20
        },
        {
            title: "Corredor Intermedio",
            description: "Mantén una velocidad promedio de 10 km/h corriendo",
            condition: "Velocidad promedio de 10 km/h corriendo",
            icon: "speed",
            type: "speed_average",
            targetValue: 2.78, // m/s
            activityType: "running",
            difficulty: "silver",
            points: 40
        },
        {
            title: "Corredor Avanzado",
            description: "Mantén una velocidad promedio de 12 km/h corriendo",
            condition: "Velocidad promedio de 12 km/h corriendo",
            icon: "speed",
            type: "speed_average",
            targetValue: 3.33, // m/s
            activityType: "running",
            difficulty: "silver",
            points: 60
        },
        {
            title: "Velocista",
            description: "Mantén una velocidad promedio de 15 km/h corriendo",
            condition: "Velocidad promedio de 15 km/h corriendo",
            icon: "speed",
            type: "speed_average",
            targetValue: 4.17, // m/s
            activityType: "running",
            difficulty: "gold",
            points: 100
        },
        {
            title: "Corredor de Élite",
            description: "Mantén una velocidad promedio de 18 km/h corriendo",
            condition: "Velocidad promedio de 18 km/h corriendo",
            icon: "speed",
            type: "speed_average",
            targetValue: 5.0, // m/s
            activityType: "running",
            difficulty: "diamond",
            points: 150
        },
        // Ciclismo
        {
            title: "Ciclista Principiante",
            description: "Mantén una velocidad promedio de 15 km/h en bicicleta",
            condition: "Velocidad promedio de 15 km/h en bicicleta",
            icon: "speed",
            type: "speed_average",
            targetValue: 4.17, // m/s
            activityType: "cycling",
            difficulty: "bronze",
            points: 20
        },
        {
            title: "Ciclista Intermedio",
            description: "Mantén una velocidad promedio de 20 km/h en bicicleta",
            condition: "Velocidad promedio de 20 km/h en bicicleta",
            icon: "speed",
            type: "speed_average",
            targetValue: 5.56, // m/s
            activityType: "cycling",
            difficulty: "silver",
            points: 40
        },
        {
            title: "Ciclista Avanzado",
            description: "Mantén una velocidad promedio de 25 km/h en bicicleta",
            condition: "Velocidad promedio de 25 km/h en bicicleta",
            icon: "speed",
            type: "speed_average",
            targetValue: 6.94, // m/s
            activityType: "cycling",
            difficulty: "gold",
            points: 80
        },
        {
            title: "Ciclista de Élite",
            description: "Mantén una velocidad promedio de 30 km/h en bicicleta",
            condition: "Velocidad promedio de 30 km/h en bicicleta",
            icon: "speed",
            type: "speed_average",
            targetValue: 8.33, // m/s
            activityType: "cycling",
            difficulty: "diamond",
            points: 120
        },
    ];

    // ===== LOGROS DE ELEVACIÓN =====
    const elevationAchievements: Partial<IAchievement>[] = [
        {
            title: "Escalón",
            description: "Gana 100m de elevación en una actividad",
            condition: "100m de elevación en una actividad",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 100,
            activityType: "all",
            difficulty: "bronze",
            points: 25
        },
        {
            title: "Ascenso Pendiente",
            description: "Gana 250m de elevación en una actividad",
            condition: "250m de elevación en una actividad",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 250,
            activityType: "all",
            difficulty: "bronze",
            points: 40
        },
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
        {
            title: "Montañero",
            description: "Gana 1000m de elevación en una actividad",
            condition: "1000m de elevación en una actividad",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 1000,
            activityType: "all",
            difficulty: "gold",
            points: 120
        },
        {
            title: "Rey de la Montaña",
            description: "Gana 2000m de elevación en una actividad",
            condition: "2000m de elevación en una actividad",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 2000,
            activityType: "all",
            difficulty: "diamond",
            points: 200
        },
        // Senderismo específico
        {
            title: "Senderista de Montaña",
            description: "Gana 800m de elevación en una actividad de senderismo",
            condition: "800m de elevación en una actividad de senderismo",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 800,
            activityType: "hiking",
            difficulty: "gold",
            points: 100
        },
        // Ciclismo específico
        {
            title: "Ciclista de Montaña",
            description: "Gana 1500m de elevación en una actividad de ciclismo",
            condition: "1500m de elevación en una actividad de ciclismo",
            icon: "terrain",
            type: "elevation_gain",
            targetValue: 1500,
            activityType: "cycling",
            difficulty: "diamond",
            points: 180
        },
    ];

    // ===== LOGROS DE CONSISTENCIA =====
    const consistencyAchievements: Partial<IAchievement>[] = [
        {
            title: "Par de Días",
            description: "Realiza actividad 2 días consecutivos",
            condition: "2 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 2,
            activityType: "all",
            difficulty: "bronze",
            points: 20
        },
        {
            title: "Constancia",
            description: "Realiza actividad 3 días consecutivos",
            condition: "3 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 3,
            activityType: "all",
            difficulty: "bronze",
            points: 30
        },
        {
            title: "Hábito Saludable",
            description: "Realiza actividad 5 días consecutivos",
            condition: "5 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 5,
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
        {
            title: "Dos Semanas Perfectas",
            description: "Realiza actividad 14 días consecutivos",
            condition: "14 días consecutivos de actividad",
            icon: "event",
            type: "consecutive_days",
            targetValue: 14,
            activityType: "all",
            difficulty: "diamond",
            points: 200
        },
    ];

    // ===== LOGROS ESPECÍFICOS POR ACTIVIDAD =====
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
            points: 25
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
            points: 60
        },
        {
            title: "Corredor Experimentado",
            description: "Completa 50 actividades de running",
            condition: "50 actividades de running",
            icon: "directions_run",
            type: "activity_count",
            targetValue: 50,
            activityType: "running",
            difficulty: "gold",
            points: 120
        },
        {
            title: "Corredor de Élite",
            description: "Completa 100 actividades de running",
            condition: "100 actividades de running",
            icon: "directions_run",
            type: "activity_count",
            targetValue: 100,
            activityType: "running",
            difficulty: "diamond",
            points: 200
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
            points: 25
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
            points: 60
        },
        {
            title: "Ciclista Experimentado",
            description: "Completa 50 actividades de ciclismo",
            condition: "50 actividades de ciclismo",
            icon: "directions_bike",
            type: "activity_count",
            targetValue: 50,
            activityType: "cycling",
            difficulty: "gold",
            points: 120
        },
        {
            title: "Ciclista de Élite",
            description: "Completa 100 actividades de ciclismo",
            condition: "100 actividades de ciclismo",
            icon: "directions_bike",
            type: "activity_count",
            targetValue: 100,
            activityType: "cycling",
            difficulty: "diamond",
            points: 200
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
            points: 25
        },
        {
            title: "Senderista Regular",
            description: "Completa 20 actividades de senderismo",
            condition: "20 actividades de senderismo",
            icon: "terrain",
            type: "activity_count",
            targetValue: 20,
            activityType: "hiking",
            difficulty: "silver",
            points: 60
        },
        {
            title: "Senderista Experimentado",
            description: "Completa 50 actividades de senderismo",
            condition: "50 actividades de senderismo",
            icon: "terrain",
            type: "activity_count",
            targetValue: 50,
            activityType: "hiking",
            difficulty: "gold",
            points: 120
        },
        {
            title: "Montañista de Élite",
            description: "Completa 100 actividades de senderismo",
            condition: "100 actividades de senderismo",
            icon: "terrain",
            type: "activity_count",
            targetValue: 100,
            activityType: "hiking",
            difficulty: "diamond",
            points: 200
        },
        // Walking
        {
            title: "Caminante Novato",
            description: "Completa 5 actividades de caminata",
            condition: "5 actividades de caminata",
            icon: "directions_walk",
            type: "activity_count",
            targetValue: 5,
            activityType: "walking",
            difficulty: "bronze",
            points: 25
        },
        {
            title: "Caminante Regular",
            description: "Completa 20 actividades de caminata",
            condition: "20 actividades de caminata",
            icon: "directions_walk",
            type: "activity_count",
            targetValue: 20,
            activityType: "walking",
            difficulty: "silver",
            points: 60
        },
        {
            title: "Caminante Experimentado",
            description: "Completa 50 actividades de caminata",
            condition: "50 actividades de caminata",
            icon: "directions_walk",
            type: "activity_count",
            targetValue: 50,
            activityType: "walking",
            difficulty: "gold",
            points: 120
        },
        {
            title: "Caminante de Élite",
            description: "Completa 100 actividades de caminata",
            condition: "100 actividades de caminata",
            icon: "directions_walk",
            type: "activity_count",
            targetValue: 100,
            activityType: "walking",
            difficulty: "diamond",
            points: 200
        },
    ];
     }