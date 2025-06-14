import mongoose, {ObjectId,Schema, model, Types} from "mongoose"

export const achievementSchema = new Schema<IAchievement>({
    title: { 
        type: String, 
        required: true,
        unique: true  
    },
    description: { 
        type: String, 
        required: true
    }, 
    condition: { 
        type: String, 
        required: true
    },
    icon: {
        type: String, 
        required: true
    },
    usersUnlocked: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        default: []
    }],
    type: {
        type: String,
        enum: ['distance_total', 'distance_single', 'time_total', 'time_single', 'time_monthly', 'time_yearly', 'activity_count', 'consecutive_days', 'speed_average', 'elevation_gain'],
        required: true
    },
    targetValue: {
        type: Number,
        required: true
    },
    activityType: {
        type: String,
        enum: ['running', 'cycling', 'hiking', 'walking', 'all'],
        default: 'all'
    },
    difficulty: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'diamond'],
        required: true
    },
    points: {
        type: Number,
        default: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ← ÍNDICE COMPUESTO para mayor seguridad
achievementSchema.index({ title: 1, type: 1, targetValue: 1 }, { unique: true });

export interface IAchievement {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description: string; 
    condition: string;
    icon: string;
    usersUnlocked: mongoose.Types.ObjectId[];
    type: 'distance_total' | 'distance_single' | 'time_total' | 'time_single' | 'time_monthly' | 'time_yearly' | 'activity_count' | 'consecutive_days' | 'speed_average' | 'elevation_gain';
    targetValue: number;
    activityType?: 'running' | 'cycling' | 'hiking' | 'walking' | 'all';
    difficulty: 'bronze' | 'silver' | 'gold' | 'diamond';
    points: number;
    createdAt?: Date;
}

const AchievementModel = mongoose.model('Achievement',achievementSchema);
export default AchievementModel;