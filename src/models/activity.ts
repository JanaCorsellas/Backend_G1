import {ObjectId,Schema, model, Types}from "mongoose"

export interface IActivity {
    

    username: string;
    startTime: Date; 
    endTime: Date;
    duration: number;//minutos
    distance: number;
    elevationGain: number;
    averageSpeed: number;
    caloriesBurned: number; //almacenar en minutos
    //route: ;
    //musicPlaylist: Types.ObjectId[] ;
    type:"running"|"cycling"|"trekking";
}

export const activitySchema = new Schema<IActivity>({

    username: { type: String, required: true},
    startTime: { type: Date, required: true}, 
    endTime: { type: Date, required: true},
    duration: {type: Number, required:true},
    distance: { type: Number,required:true},
    elevationGain: { type: Number,required:true},
    averageSpeed: { type: Number,required:true},
    caloriesBurned: { type: Number,required:true},
    //route: ;
    //musicPlaylist: Types.ObjectId[] ;
    type: {type: String, enum: ["running","cycling","trekking"]},
});

const activityModel = model<IActivity>('Activity',activitySchema);

export default  activityModel;