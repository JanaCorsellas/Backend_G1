import mongoose, {ObjectId,Schema, model, Types} from "mongoose"

export const achievementSchema = new Schema<IAchievement>({
    title: { 
        type: String, 
        required: true
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
 usersUnlocked: { 
      type: [mongoose.Schema.Types.ObjectId], 
      ref: 'User', 
      required: true 
    }
});

export interface IAchievement {
    
    title: string;
    description: string; 
    condition: string;
    icon: string;
    usersUnlocked: mongoose.Types.ObjectId[];
}

const AchievementModel = mongoose.model('Achievement',achievementSchema);
export default AchievementModel;