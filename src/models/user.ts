// src/models/user.ts - Actualizado para Cloudinary
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


userSchema.virtual('profilePictureUrl').get(function() {
    // Con Cloudinary, profilePicture ya es la URL completa
    return this.profilePicture || null;
});


userSchema.virtual('profilePictureThumb').get(function() {
    if (!this.profilePicture) return null;
    
    // Si es una URL de Cloudinary, podemos crear una versión thumbnail
    if (this.profilePicture.includes('cloudinary.com')) {
        // Insertar transformación para thumbnail (100x100)
        return this.profilePicture.replace(
            '/image/upload/',
            '/image/upload/w_100,h_100,c_fill,g_face/'
        );
    }
    
    return this.profilePicture;
});


userSchema.virtual('profilePictureMedium').get(function() {
    if (!this.profilePicture) return null;
    
    if (this.profilePicture.includes('cloudinary.com')) {
        // Insertar transformación para mediano (250x250)
        return this.profilePicture.replace(
            '/image/upload/',
            '/image/upload/w_250,h_250,c_fill,g_face/'
        );
    }
    
    return this.profilePicture;
});


userSchema.methods.getCloudinaryPublicId = function() {
    if (!this.profilePicture || !this.profilePicture.includes('cloudinary.com')) {
        return null;
    }
    
    try {
        // Extraer public_id de URL de Cloudinary
        const matches = this.profilePicture.match(/\/v\d+\/(.+)\.[a-zA-Z]+$/);
        return matches && matches[1] ? matches[1] : null;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

// Asegurar que los virtuals se incluyan en JSON
userSchema.set('toJSON', { virtuals: true });


export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
    profilePicture?: string; 
    profilePictureUrl?: string; 
    profilePictureThumb?: string; 
    profilePictureMedium?: string; 
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
    
   
    getCloudinaryPublicId(): string | null;
}

// Pre-hooks existentes se mantienen igual...
userSchema.pre('find', function() {
    const includeInvisible = (this as any)._mongooseOptions?.includeInvisible;
    if (!includeInvisible) {
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