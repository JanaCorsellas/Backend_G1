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

export const getAllSongsHandler = async (req: Request, res: Response) => {
    try{
        const songs = await songService.getAllSongs();
        if(!songs){
            res.status(401).json({message: 'No songs found'});
            return;
        }
        res.status(201).json(songs);
    }catch(err:any){
        res.status(500).json({message:"Server error: " ,err});

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
