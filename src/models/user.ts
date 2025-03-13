import mongoose, { Schema, Types } from 'mongoose';
const userSchema = new mongoose.Schema({
    username :{
        type: String,
        require: true
    },
    password :{
        type: String,
        require: true
    },
    email :{
        type: String,
        require: true
    },
    profilePicture :{
        type: String,
        require: false
    },
    bio :{
        type: String,
        require: false
    },
    level :{
        type: Number,
        require: true
    },
    totalDistance :{
        type: Number,
        require: true
    },
    totalTime :{
        type: Number,
        require: true
    },
    activities :[{
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        require: true
    }],
    achievements :[{
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
        require: true
    }],
    challengesCompleted :[{
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        require: true
    }],
    createdAt :{
        type: Date,
        require: true
    },
    updatedAt :{
        type: Date,
        require: true
    },
   
});

export interface IUser{
    toObject(): {
        _id: Types.ObjectId | string; 
        username: string;
        email: string;
        password: string;
        profilePicture?: string;
        bio?: string;
        level: number;
        totalDistance: number;
        totalTime: number;
        activities: mongoose.Types.ObjectId[];
        achievements: mongoose.Types.ObjectId[];
        challengesCompleted: mongoose.Types.ObjectId[];
        createdAt: Date;
        updatedAt: Date;
    };
}

const User = mongoose.model('User', userSchema);
export default User;