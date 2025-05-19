import mongoose, {ObjectId,Schema, model, Types} from "mongoose"

export const challengeSchema = new Schema<IChallenge>({
    title: { 
        type: String, 
        required: true
    },
    description: { 
        type: String, 
        required: true
    }, 
    goalType: { //Pot ser distància, temps, velocitat, etc
        type: String, 
        required: true
    },
    goalValue: { //Valor de la meta, pot ser 5km, 10min, 20km/h, etc
        type: String, 
        required: true
    },
    reward: { //Recompensa en punts
        type: Number,
        required: true
    },
    startDate: { //Data d'inici del repte
        type: Date,
        required: true
    },
    endDate: { //Data de finalització del repte
        type: Date,
        required: true
    }
});

export interface IChallenge {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description: string; 
    goalType: string;
    goalValue: string;
    reward: number;
    startDate: Date;
    endDate: Date;
}

const ChallengeModel = mongoose.model('Challenge', challengeSchema);
export default ChallengeModel;