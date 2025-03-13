import mongoose from 'mongoose';
import User from '../models/user';


export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    userData.isDeleted = false; // Set default value for new users
    const user = await User.create(userData);
    const userObject = user.toObject();
    return {
      ...userObject,
      _id: userObject._id.toString(),
      activities: userObject.activities.map(id => id.toString()),
      achievements: userObject.achievements.map(id => id.toString()),
      challengesCompleted: userObject.challengesCompleted.map(id => id.toString())
    };
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ _id: userId, isDeleted: false })
      .populate('activities')
      .populate('achievements')
      .populate('challengesCompleted');
    
    if (!user) return null;

    const userObject = user.toObject();
    return {
      ...userObject,
      _id: userObject._id.toString(),
      activities: userObject.activities.map(id => id.toString()),
      achievements: userObject.achievements.map(id => id.toString()),
      challengesCompleted: userObject.challengesCompleted.map(id => id.toString())
    };
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {
  try {
    // If isDeleted is true, we're performing a soft delete
    if (updateData.isDeleted) {
      updateData.deletedAt = new Date();
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false }, // Only update if not already deleted
      updateData,
      { new: true }
    ).populate('activities')
     .populate('achievements')
     .populate('challengesCompleted');

    if (!user) return null;

    const userObject = user.toObject();
    return {
      ...userObject,
      _id: userObject._id.toString(),
      activities: userObject.activities.map(id => id.toString()),
      achievements: userObject.achievements.map(id => id.toString()),
      challengesCompleted: userObject.challengesCompleted.map(id => id.toString())
    };
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const users = await User.find({ isDeleted: false })
      .populate('activities')
      .populate('achievements')
      .populate('challengesCompleted');

    return users.map(user => {
      const userObject = user.toObject();
      return {
        ...userObject,
        _id: userObject._id.toString(),
        activities: userObject.activities.map(id => id.toString()),
        achievements: userObject.achievements.map(id => id.toString()),
        challengesCompleted: userObject.challengesCompleted.map(id => id.toString())
      };
    });
  } catch (error) {
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ username, isDeleted: false })
      .populate('activities')
      .populate('achievements')
      .populate('challengesCompleted');

    if (!user) return null;

    const userObject = user.toObject();
    return {
      ...userObject,
      _id: userObject._id.toString(),
      activities: userObject.activities.map(id => id.toString()),
      achievements: userObject.achievements.map(id => id.toString()),
      challengesCompleted: userObject.challengesCompleted.map(id => id.toString())
    };
  } catch (error) {
    throw error;
  }
};