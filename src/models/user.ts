// src/models/user.ts - Actualizado con Sistema de Seguimiento Completo
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
    googleId: {
        type: String,
        unique: true,    
        sparse: true,
        default: null,
        required: false
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
    },
    // =============================
    // SISTEMA DE SEGUIMIENTO
    // =============================
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: []        
    }],
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: []
    }],
}, {
    versionKey: false,
    timestamps: true,
});

// =============================
// VIRTUALS PARA CLOUDINARY
// =============================

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

// =============================
// VIRTUALS PARA SISTEMA DE SEGUIMIENTO
// =============================

userSchema.virtual('followersCount').get(function() {
    return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
    return this.following ? this.following.length : 0;
});

userSchema.virtual('isPopular').get(function() {
    return this.followers && this.followers.length >= 100;
});

userSchema.virtual('followRatio').get(function() {
    const followersCount = this.followers ? this.followers.length : 0;
    const followingCount = this.following ? this.following.length : 0;
    
    if (followingCount === 0) return followersCount;
    return parseFloat((followersCount / followingCount).toFixed(2));
});

// =============================
// MÉTODOS DEL SCHEMA
// =============================

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

// Método para verificar si sigue a un usuario específico
userSchema.methods.isFollowing = function(userId: string | Types.ObjectId) {
    const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.following.some((id: Types.ObjectId) => id.equals(targetId));
};

// Método para verificar si es seguido por un usuario específico
userSchema.methods.isFollowedBy = function(userId: string | Types.ObjectId) {
    const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.followers.some((id: Types.ObjectId) => id.equals(targetId));
};

// Método para obtener información básica del usuario (sin datos sensibles)
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        username: this.username,
        profilePicture: this.profilePicture,
        profilePictureThumb: this.profilePictureThumb,
        profilePictureMedium: this.profilePictureMedium,
        bio: this.bio,
        level: this.level,
        followersCount: this.followersCount,
        followingCount: this.followingCount,
        isPopular: this.isPopular,
        followRatio: this.followRatio,
        createdAt: this.createdAt,
        visibility: this.visibility
    };
};

// Método para obtener estadísticas de seguimiento
userSchema.methods.getFollowStats = function() {
    return {
        followersCount: this.followersCount,
        followingCount: this.followingCount,
        followRatio: this.followRatio,
        isPopular: this.isPopular
    };
};

// =============================
// MIDDLEWARES Y HOOKS
// =============================

// Asegurar que los virtuals se incluyan en JSON
userSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        // Eliminar campos sensibles al serializar
        delete ret.password;
        delete ret.refreshToken;
        return ret;
    }
});

userSchema.set('toObject', { virtuals: true });

// Pre-hooks existentes para visibilidad
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

// Middleware para limpiar referencias en followers/following al eliminar usuario
userSchema.pre('findOneAndDelete', async function() {
    const user = await this.model.findOne(this.getQuery());
    if (user) {
        // Remover este usuario de las listas following de sus seguidores
        await this.model.updateMany(
            { _id: { $in: user.followers } },
            { $pull: { following: user._id } }
        );
        
        // Remover este usuario de las listas followers de los que sigue
        await this.model.updateMany(
            { _id: { $in: user.following } },
            { $pull: { followers: user._id } }
        );
    }
});

// =============================
// ÍNDICES PARA PERFORMANCE
// =============================

// Índices para mejorar performance en consultas de seguimiento
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ username: 1, visibility: 1 });
userSchema.index({ createdAt: -1 });

// Índice compuesto para búsquedas
userSchema.index({ 
    username: 'text', 
    bio: 'text' 
}, {
    weights: {
        username: 10,
        bio: 5
    }
});

// =============================
// INTERFACE TYPESCRIPT
// =============================

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
    googleId?: string;
    activities: Types.ObjectId[];
    achievements: Types.ObjectId[];
    challengesCompleted: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    visibility: boolean;
    role: 'user' | 'admin';
    refreshToken?: string;
    
    // Sistema de seguimiento
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    
    // Virtuals de seguimiento
    followersCount: number;
    followingCount: number;
    isPopular: boolean;
    followRatio: number;
    
    // Métodos
    getCloudinaryPublicId(): string | null;
    isFollowing(userId: string | Types.ObjectId): boolean;
    isFollowedBy(userId: string | Types.ObjectId): boolean;
    getPublicProfile(): any;
    getFollowStats(): any;
}

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;