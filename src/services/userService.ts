import { Types } from 'mongoose';
import User, { IUser } from '../models/user';

// Helper function to transform user document to IUser
const transformUser = (user: any): IUser => {
  const userObject = user.toObject();
  return {
    ...userObject,
    _id: userObject._id.toString(),
    activities: userObject.activities.map((id: Types.ObjectId) => id.toString()),
    achievements: userObject.achievements.map((id: Types.ObjectId) => id.toString()),
    challengesCompleted: userObject.challengesCompleted.map((id: Types.ObjectId) => id.toString())
  };
};

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    
    const user = await User.create(userData);
    return transformUser(user);
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ _id: userId})
      .populate('activities achievements challengesCompleted');
    return user ? transformUser(user) : null;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      updateData,
      { new: true }
    ).populate('activities achievements challengesCompleted');
    return user ? transformUser(user) : null;
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const users = await User.find({ isDeleted: false })
      .populate('activities achievements challengesCompleted');
    return users.map(transformUser);
  } catch (error) {
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ username, isDeleted: false })
      .populate('activities achievements challengesCompleted');
    return user ? transformUser(user) : null;
  } catch (error) {
    throw error;
  }
};