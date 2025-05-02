import mongoose, {Schema} from "mongoose";
const songSchema = new mongoose.Schema({
    title :{
        type: String,
        require: true
    },
    artist :{
        type: String,
        require: true
    },
    album :{
        type: String,
        require: true
    },
    genre :{
        type: String,
        require: true
    },
    duration :{
        type: Number,
        require: false
    },
    spotifyLink :{
        type: String,
        require: false
    },
    bpm :{
        type: Number,
        require: false
    }
});

export interface ISong{
    title: string;
    artist: string;
    album: string;
    genre: string;
    duration?: number;
    spotifyLink?: string;
    bpm?: number;
}

const SongModel = mongoose.model('Song', songSchema);
export default SongModel;