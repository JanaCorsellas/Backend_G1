import * as songService from '../services/songService';

import { Request, Response } from 'express';

export const createSongHandler = async (req: Request, res: Response): Promise <any> => {
    try{
        const song = await songService.createSong(req.body);
        if(!song){
            return res.status(400).json({message: 'Error creating song'});
            return;
        }
        res.status(201).json(song);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

/**
 * Obtenir totes le cançons
 */
export const getSongs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtenir pàgina i límit dels paràmetres de consulta
    const page = parseInt(req.query.page?.toString() || '1', 10);
    const limit = parseInt(req.query.limit?.toString() || '10', 10);
    
    console.log(`Sol·licitud de cançons: pàgina ${page}, límit ${limit}`);
    
    // Validar paràmetres de paginació
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ message: 'Paràmetres de paginació invàlids' });
      return;
    }
    
    // Obtenir usuaris paginats
    const result = await songService.getSongs(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtenir cançons:', error);
    res.status(500).json({ message: 'Error al obtenir cançons' });
  }
};

export const getSongByIdHandler = async (req: Request, res: Response) => {
    try{
        const song = await songService.getSongById(req.params.id);
        if(!song){
            res.status(401).json({message: `Song with Id ${req.params.id} not found`});
            return;
        }
        res.status(201).json(song);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const getSongByNameHandler = async (req: Request, res: Response) => {
    try{
        const song = await songService.getSongByName(req.params.name);
        if(!song){
            res.status(401).json({message: `Song "${req.params.name}" not found`});
            return;
        }
        res.status(201).json(song);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const getSongsByArtistHandler = async (req: Request, res: Response) => {
    try{
        const songs = await songService.getSongsByArtist(req.params.artist);
        if(!songs){
            res.status(401).json({message: `Artist "${req.params.artist}" not found`});
            return;
        }
        res.status(201).json(songs);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const getSongsByGenreHandler = async (req: Request, res: Response) => {
    try{
        const songs = await songService.getSongsByGenre(req.params.genre);
        if(!songs){
            res.status(401).json({message: `Genre "${req.params.genre}" not found`});
            return;
        }
        res.status(201).json(songs);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const getSymilarBpmHandler = async (req: Request, res: Response) => {
    try{
        const songs = await songService.getSymilarBpm(Number(req.params.bpm));
        if(!songs){
            res.status(401).json({message: `Songs with bpm symilar to "${req.params.bpm}" not found`});
            return;
        }
        res.status(201).json(songs);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const updateSongHandler = async (req: Request, res: Response) => {
    try{
        const song = await songService.updateSong(req.params.id,req.body);
        if(!song){
            res.status(401).json({message: `Song "${req.body.title}" not found`});
            return;
        }
        res.status(201).json(song);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};

export const deleteSongHandler = async (req: Request, res: Response) => {
    try{
        const song = await songService.deleteSong(req.params.id);
        if(!song){
            res.status(401).json({message: `Song "${req.params.title}" not found`});
            return;
        }
        res.status(201).json(song);
    }catch(err:any){
        res.status(500).json({message:"Server error: ", err});
    }
};
