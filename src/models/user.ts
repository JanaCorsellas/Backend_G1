import mongoose, { Schema, Types, Document } from "mongoose";

// Schema definition
const userSchema = new Schema({
    username: {
        type: String,
        unique: false,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    profilePicture: {
        type: String,
        default: null,
        required: false
    },
    bio: {
        type: String,
        default: null,
        required: false
    },
    level: {
        type: Number,
        default: 0,
        required: true
    },
    totalDistance: {
        type: Number,
        default: 0,
        required: true
    },
    totalTime: {
        type: Number,
        default: 0,
        required: true
    },
    activities: [{
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: true,
        default: []
    }],
    achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true,
        default: []
    }],
    challengesCompleted: [{
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
        default: []
    }],
    visibility: {
        type: Boolean,
        default: true,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },
    refreshToken: {
        type: String,
        default: null
    }
}, {
    versionKey: false,
    timestamps: true,
});

// Interface for the User document
export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
    bio?: string;
    level: number;
    totalDistance: number;
    totalTime: number;
    activities: Types.ObjectId[];
    achievements: Types.ObjectId[];
    challengesCompleted: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    visibility: boolean;
    role: 'user' | 'admin';
    refreshToken?: string;
}

// Modificat: no aplicar el pre-hook quan es demana incloure usuaris invisibles
userSchema.pre('find', function() {
    // Verificar si la consulta té l'opció includeInvisible
    const includeInvisible = (this as any)._mongooseOptions?.includeInvisible;
    
    if (!includeInvisible) {
        // Només filtrar si no es demana incloure usuaris invisibles
        this.where({ visibility: { $ne: false } });
    }
});

userSchema.pre('findOne', function() {
    const includeInvisible = (this as any)._mongooseOptions?.includeInvisible;
    
    if (!includeInvisible) {
        this.where({ visibility: { $ne: false } });
    }
});

userSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;