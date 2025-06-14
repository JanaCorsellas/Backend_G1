import SongModel, {ISong} from '../models/song';
import mongoose from 'mongoose';

export const createSong = async (song:ISong) => {
    const newSong = new SongModel(song);
    return await newSong.save();
};

// Obtenir totes les cançons
export const getSongs = async (page: number, limit: number): Promise<{
  songs: ISong[];
  totalSongs: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error("La connexió a MongoDB no està disponible");
    }
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("La base de de dades no està disponible");
    }
    
    const collection = db.collection('songs');
    
    const songs = await collection.find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalSongs = await collection.countDocuments(query);
    
    const totalPages = Math.ceil(totalSongs / limit);
    
    console.log(`Trobats ${songs.length} cançons d'un total de ${totalSongs}`);
    
    return {
      songs: songs as unknown as ISong[],
      totalSongs,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error al obtenir cançons:', error);
    throw error;
  }
};

export const getSongById = async (id:string) => {
    return await SongModel.findById(id);
};

export const getSongByName = async (name:string) => {
    return await SongModel.find({title:name});
};

export const getSongsByArtist = async (artist:string) => {
    return await SongModel.find({artist:artist});
};

export const getSongsByGenre = async (genre:string) => {
    return await SongModel.find({genre:genre});
};

export const getSymilarBpm = async (bpm:number) => {
    const songs = await SongModel.find();
    return songs.filter(song => song.bpm !== undefined && song.bpm !== null && Math.abs(song.bpm - bpm) < 20);
};

export const updateSong = async (id:string, song:ISong) => {
    return await SongModel.findByIdAndUpdate(id,song,{new:true});
};

export const deleteSong = async (id:string) => {
    return await SongModel.findByIdAndDelete(id);
};