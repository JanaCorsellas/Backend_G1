import mongoose, { Schema, Types, Document } from "mongoose";

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
    fcmToken: {
        type: String,
        default: null,
        sparse: true // Permet que sigui null i no causi problemes d'unicitat
    },
    fcmTokens: [{
        type: String
    }],
    fcmTokenUpdatedAt: {
        type: Date,
        default: null
    },
    notificationSettings: {
        type: {
            friendRequests: { type: Boolean, default: true },
            activityUpdates: { type: Boolean, default: true },
            achievements: { type: Boolean, default: true },
            challenges: { type: Boolean, default: true },
            chatMessages: { type: Boolean, default: true }
        },
        default: () => ({
            friendRequests: true,
            activityUpdates: true,
            achievements: true,
            challenges: true,
            chatMessages: true
        })
    },
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

// Virtuals per cloudinary
userSchema.virtual('profilePictureUrl').get(function() {
    return this.profilePicture || null;
});

userSchema.virtual('profilePictureThumb').get(function() {
    if (!this.profilePicture) return null;
    
    if (this.profilePicture.includes('cloudinary.com')) {
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
        return this.profilePicture.replace(
            '/image/upload/',
            '/image/upload/w_250,h_250,c_fill,g_face/'
        );
    }
    
    return this.profilePicture;
});

// Virtuals per seguiment
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

// Verificar si segueix un usuari específic
userSchema.methods.isFollowing = function(userId: string | Types.ObjectId) {
    const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.following.some((id: Types.ObjectId) => id.equals(targetId));
};

// Verificar si és seguit per un usuari específic
userSchema.methods.isFollowedBy = function(userId: string | Types.ObjectId) {
    const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.followers.some((id: Types.ObjectId) => id.equals(targetId));
};

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

// Mètode per obtenir estadístiques de seguiment
userSchema.methods.getFollowStats = function() {
    return {
        followersCount: this.followersCount,
        followingCount: this.followingCount,
        followRatio: this.followRatio,
        isPopular: this.isPopular
    };
};

// Assegurar que els virtuals s'inclouen en JSON
userSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        // Eliminar camps sensibles
        delete ret.password;
        delete ret.refreshToken;
        return ret;
    }
});

userSchema.set('toObject', { virtuals: true });

// Pre-hooks existents per visibilitat
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
        // Esborrar aquest usuari de les llistes de followers dels que el segueixen
        await this.model.updateMany(
            { _id: { $in: user.followers } },
            { $pull: { following: user._id } }
        );
        
        // Esborrar aquest usuari de les llistes de followers dels que el segueixen
        await this.model.updateMany(
            { _id: { $in: user.following } },
            { $pull: { followers: user._id } }
        );
    }
});


// Índex per millorar consultes de seguiment
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ username: 1, visibility: 1 });
userSchema.index({ createdAt: -1 });

userSchema.index({ 
    username: 'text', 
    bio: 'text' 
}, {
    weights: {
        username: 10,
        bio: 5
    }
});

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
    fcmToken?: string;
    fcmTokens?: string[]; // per compatibilitat amb múltiples dispositius
    fcmTokenUpdatedAt?: Date; // data de l'última actualització del token FCM
    notificationSettings?: {     // Configuració de notificacions
        friendRequests: boolean;
        activityUpdates: boolean;
        achievements: boolean;
        challenges: boolean;
        chatMessages: boolean;
    };

    // Sistema de seguiment
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    
    // Virtuals de seguiment
    followersCount: number;
    followingCount: number;
    isPopular: boolean;
    followRatio: number;
    

    getCloudinaryPublicId(): string | null;
    isFollowing(userId: string | Types.ObjectId): boolean;
    isFollowedBy(userId: string | Types.ObjectId): boolean;
    getPublicProfile(): any;
    getFollowStats(): any;
}

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;

export function countDocuments() {
  throw new Error('Function not implemented.');
}
