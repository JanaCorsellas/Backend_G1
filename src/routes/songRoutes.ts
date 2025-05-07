import express from 'express';
import * as songController from '../controllers/songController';

const router = express.Router();


/**
 * @openapi
 * components:
 *   schemas:
 *     Song:
 *       type: object
 *       required:
 *         - title
 *         - artist
 *         - album
 *       properties:
 *         title:
 *           type: string
 *           description: El títol de la cançó
 *         artist:
 *           type: string
 *           description: L'artista de la cançó
 *         album:
 *           type: string
 *           description: L'àlbum a la qual la cançó pertany
 *         genre:
 *           type: string
 *           description: El gènere de la cançó
 *         duration:
 *           type: number
 *           description: La duració de la cançó en segons
 *         spotifyLink:
 *           type: string
 *           description: L'enllaç de Spotify de la cançó
 *         bpm:
 *           type: number
 *           description: Les pulsacions per minut que es té generalment amb aquesta cançó
 *       example:
 *         title: "Shape of You"
 *         artist: "Ed Sheeran"
 *         album: "÷ (Divide)"
 *         genre: "Pop"
 *         duration: 233
 *         spotifyLink: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3"
 *         bpm: 96
 */

/**
 * @openapi
 * /api/songs:
 *   post:
 *     summary: Create a new song
 *     tags: [Songs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - artist
 *               - album
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               genre:
 *                 type: string
 *               duration:
 *                type: number
 *               spotifyLink:
 *                type: string
 *               bpm:
 *                type: number
 *     responses:
 *       201:
 *         description: Canción creada exitosamente
 *       400:
 *        description: Error creando la canción
 *       500:
 *        description: Error del servidor
 */
router.post('/', songController.createSongHandler);

/**
 * @openapi
 * /api/songs:
 *   get:
 *     summary: Get all songs
 *     tags: [Songs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of songs per page
 *     responses:
 *       200:
 *         description: Cançons trobades
 *       401:
 *        description: No s'han trobat cançons
 *       500:
 *        description: Error del servidor
 */
router.get('/', songController.getSongsHandler);

/**
 * @openapi
 * /api/songs/{id}:
 *   get:
 *     summary: Get a song by its ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la canción
 *     responses:
 *       201:
 *         description: Canción encontrada
 *       401:
 *         description: Canción no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', songController.getSongByIdHandler);

/**
 * @openapi
 * /api/songs/name/{name}:
 *   get:
 *     summary: Get a song by its name
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la canción
 *     responses:
 *       201:
 *         description: Canción encontrada
 *       401:
 *         description: Canción no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/name/:name', songController.getSongByNameHandler);

/**
 * @openapi
 * /api/songs/artist/{artist}:
 *   get:
 *     summary: Get a list of songs by an artist
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: artist
 *         required: true
 *         schema:
 *           type: string
 *         description: Artista de la canción
 *     responses:
 *       201:
 *         description: Artista encontrado
 *       401:
 *         description: Artista no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/artist/:artist', songController.getSongsByArtistHandler);

/**
 * @openapi
 * /api/songs/genre/{genre}:
 *   get:
 *     summary: Get a list of songs by genre
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Género de la canción
 *     responses:
 *       201:
 *         description: Género encontrado
 *       401:
 *         description: Género no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/genre/:genre', songController.getSongsByGenreHandler);

/**
 * @openapi
 * /api/songs/bpm/{bpm}:
 *   get:
 *     summary: Get a list of songs by similar bpm
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: bpm
 *         required: true
 *         schema:
 *           type: number
 *         description: Velocidad de la canción
 *     responses:
 *       201:
 *         description: Canciones encontradas
 *       401:
 *         description: Canciones no encontradas
 *       500:
 *         description: Error del servidor
 */
router.get('/bpm/:bpm', songController.getSimilarBPMHandler);

/**
 * @openapi
 * /api/songs/{id}:
 *   put:
 *     summary: Update a song by its ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                 title:
 *                   type: string
 *                 artist:
 *                   type: string
 *                 album:
 *                   type: string
 *                 genre:
 *                   type: string
 *                 duration:
 *                   type: number
 *                 spotifyLink:
 *                   type: string
 *                 bpm:
 *                   type: number
 *     responses:
 *       200:
 *         description: Canción actualizada exitosamente
 *       401:
 *         description: Canción no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', songController.updateSongHandler);

/**
 * @openapi
 * /api/songs/{id}:
 *   delete:
 *     summary: Delete a song by its ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la canción
 *     responses:
 *       201:
 *         description: Canción borrada
 *       401:
 *         description: Canción no borrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', songController.deleteSongHandler);

export default router;