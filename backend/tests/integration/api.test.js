const request = require('supertest');
const mongoose = require('mongoose');

// Mock external services BEFORE requiring app so they are intercepted
jest.mock('../../services/tmdbService', () => jest.fn());
jest.mock('../../services/lastFmService', () => jest.fn());
jest.mock('../../services/BookService', () => ({
    searchBooks: jest.fn(),
    fetchVolumeById: jest.fn(),
    fetchBook: jest.fn()
}));

const tmdbService = require('../../services/tmdbService');
const lastFmService = require('../../services/lastFmService');
const BookService = require('../../services/BookService');

const app = require('../../server');
const User = require('../../models/User');
const EntertainmentItem = require('../../models/EntertainmentItem');
const Review = require('../../models/Review');

describe('MediaNest Integration Tests', () => {
    let sessionCookie;
    let userId;
    let createdMovieId;

    const testUser = {
        username: 'testintegrationuser',
        email: 'testintegration@example.com',
        password: 'SecurePassword123!'
    };

    beforeAll(async () => {
        // Wait for mongoose connection to be established via robust polling
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (mongoose.connection.readyState === 1) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 50);
            });
        }

        // Clean up any test data that might exist
        await User.deleteMany({ email: testUser.email });
        await User.deleteMany({ username: testUser.username });
        await EntertainmentItem.deleteMany({ title: 'Integration Test Movie' });
        await EntertainmentItem.deleteMany({ 'metadata.externalId': { $in: ['seeded_ext_123', 'tmdb_movie_777', 'lastfm_track_888', 'book_999'] } });
    }, 15000);

    afterAll(async () => {
        // Clean up test data
        if (userId) {
            await User.findByIdAndDelete(userId);
            await Review.deleteMany({ userId });
        }
        if (createdMovieId) {
            await EntertainmentItem.findByIdAndDelete(createdMovieId);
            await Review.deleteMany({ itemId: createdMovieId });
        }
        await EntertainmentItem.deleteMany({ 'metadata.externalId': { $in: ['seeded_ext_123', 'tmdb_movie_777', 'lastfm_track_888', 'book_999'] } });
        
        // Close mongoose connection cleanly
        await mongoose.connection.close();
    });

    describe('1. Authentication Endpoints', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.username).toBe(testUser.username);
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeDefined();

            userId = res.body.user.id;
            sessionCookie = res.headers['set-cookie'];
        });

        it('should fail to register a user with a duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'differentname',
                    email: testUser.email,
                    password: 'AnotherPassword456!'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already registered');
        });

        it('should login the user successfully and return a session cookie', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.id).toBe(userId);
            expect(res.headers['set-cookie']).toBeDefined();

            // Store the session cookie for subsequent requests
            sessionCookie = res.headers['set-cookie'];
        });

        it('should fail to login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid email or password');
        });

        it('should fetch the current user profile when authenticated', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', sessionCookie);

            expect(res.status).toBe(200);
            expect(res.body.isAuthenticated).toBe(true);
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should update the authenticated user profile (username & bio)', async () => {
            const updatedUsername = 'testintegrationuser_new';
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Cookie', sessionCookie)
                .send({
                    username: updatedUsername,
                    profile: {
                        bio: 'I am a quality assurance test engineer.'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.username).toBe(updatedUsername);
            expect(res.body.user.profile.bio).toBe('I am a quality assurance test engineer.');

            // Update local tracking variable
            testUser.username = updatedUsername;
        });
    });

    describe('2. Library Management Endpoints', () => {
        const sampleItemId = '507f1f77bcf86cd799439011'; // Dummy Mongoose ObjectId string

        it('should reject unauthenticated watchlist additions with 401', async () => {
            const res = await request(app)
                .post('/api/library/add')
                .send({
                    itemId: sampleItemId,
                    itemType: 'movies'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Not authenticated');
        });

        it('should add an item to the user watchlist', async () => {
            const res = await request(app)
                .post('/api/library/add')
                .set('Cookie', sessionCookie)
                .send({
                    itemId: sampleItemId,
                    itemType: 'movies'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Added to watchlist');
        });

        it('should verify the item is in the user library', async () => {
            const res = await request(app)
                .get(`/api/library/${userId}`)
                .set('Cookie', sessionCookie);

            expect(res.status).toBe(200);
            expect(res.body.watchlist).toBeDefined();
            expect(res.body.watchlist.movies).toContain(sampleItemId);
            expect(res.body.history.movies).toHaveLength(0);
        });

        it('should move the item from watchlist to history (watched)', async () => {
            const res = await request(app)
                .put('/api/library/watched')
                .set('Cookie', sessionCookie)
                .send({
                    itemId: sampleItemId,
                    itemType: 'movies'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Moved to history');
            expect(res.body.badges).toBeDefined();
        });

        it('should verify the item moved in the library', async () => {
            const res = await request(app)
                .get(`/api/library/${userId}`)
                .set('Cookie', sessionCookie);

            expect(res.status).toBe(200);
            expect(res.body.watchlist.movies).not.toContain(sampleItemId);
            expect(res.body.history.movies).toContain(sampleItemId);
        });

        it('should remove the item entirely from the library', async () => {
            const res = await request(app)
                .delete('/api/library/remove')
                .set('Cookie', sessionCookie)
                .send({
                    itemId: sampleItemId,
                    itemType: 'movies'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Removed from library');
        });

        it('should verify the item is no longer in the library', async () => {
            const res = await request(app)
                .get(`/api/library/${userId}`)
                .set('Cookie', sessionCookie);

            expect(res.status).toBe(200);
            expect(res.body.watchlist.movies).not.toContain(sampleItemId);
            expect(res.body.history.movies).not.toContain(sampleItemId);
        });
    });

    describe('3. Review and Rating Integration', () => {
        beforeAll(async () => {
            // Seed a test movie item to review
            const movie = new EntertainmentItem({
                title: 'Integration Test Movie',
                type: 'movie',
                genres: ['Action', 'Thriller'],
                releaseYear: 2026,
                metadata: {
                    externalId: 'test_movie_ext_123',
                    description: 'A dummy movie created for integration testing.'
                }
            });
            await movie.save();
            createdMovieId = movie._id.toString();
        });

        it('should allow an authenticated user to write a review and update the average rating', async () => {
            // Write a review with rating 4.5 (which will be normalized to 9.0 in the DB)
            const res = await request(app)
                .post('/api/reviews')
                .set('Cookie', sessionCookie)
                .send({
                    itemId: createdMovieId,
                    rating: 4.5,
                    comment: 'Absolutely stunning cinematography!'
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Review added');
            expect(res.body.avg).toBe(9); // (4.5 * 2)

            // Verify the entertainment item's averageRating was updated in the database
            const movieInDb = await EntertainmentItem.findById(createdMovieId);
            expect(movieInDb.averageRating).toBe(9);
        });

        it('should calculate the average rating correctly when a second review is added', async () => {
            // Register a second temporary user to add a second review
            const secondUser = {
                username: 'secondtester',
                email: 'secondtester@example.com',
                password: 'Password123!'
            };
            await User.deleteMany({ email: secondUser.email });

            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(secondUser);

            const secondCookie = registerRes.headers['set-cookie'];
            const secondUserId = registerRes.body.user.id;

            // Add a review with rating 3.0 (normalized to 6.0 in the DB)
            const reviewRes = await request(app)
                .post('/api/reviews')
                .set('Cookie', secondCookie)
                .send({
                    itemId: createdMovieId,
                    rating: 3.0,
                    comment: 'It was okay, but a bit pacing was slow.'
                });

            expect(reviewRes.status).toBe(201);
            // Average of 9.0 and 6.0 is 7.5
            expect(reviewRes.body.avg).toBe(7.5);

            const movieInDb = await EntertainmentItem.findById(createdMovieId);
            expect(movieInDb.averageRating).toBe(7.5);

            // Clean up second user
            await User.findByIdAndDelete(secondUserId);
            await Review.deleteMany({ userId: secondUserId });
        });
    });

    describe('4. Entertainment Items Endpoints', () => {
        it('should return a pre-seeded item from the database', async () => {
            // Pre-seed an item in the DB
            const seededItem = new EntertainmentItem({
                title: 'Preseeded Movie',
                type: 'movie',
                releaseYear: 2020,
                metadata: {
                    externalId: 'seeded_ext_123',
                    description: 'Directly in DB'
                }
            });
            await seededItem.save();

            const res = await request(app)
                .get('/api/items/movies/seeded_ext_123');

            expect(res.status).toBe(200);
            expect(res.body.item).toBeDefined();
            expect(res.body.item.title).toBe('Preseeded Movie');
            expect(res.body.reviews).toEqual([]);

            // Clean up
            await EntertainmentItem.findByIdAndDelete(seededItem._id);
        });

        it('should fetch a non-existing item from TMDB, save it to the DB, and return it', async () => {
            // Setup service mock output
            tmdbService.mockResolvedValue({
                title: 'Interstellar',
                releaseYear: 2014,
                image: 'interstellar.jpg',
                description: 'Wormhole space travel',
                apiRating: 8.6,
                extra: { director: 'Christopher Nolan' }
            });

            const res = await request(app)
                .get('/api/items/movies/tmdb_movie_777');

            expect(res.status).toBe(200);
            expect(tmdbService).toHaveBeenCalledWith('tmdb_movie_777', 'movie');
            expect(res.body.item).toBeDefined();
            expect(res.body.item.title).toBe('Interstellar');
            expect(res.body.item.metadata.externalId).toBe('tmdb_movie_777');
            expect(res.body.item.metadata.director).toBe('Christopher Nolan');

            // Verify it was persisted to DB
            const dbItem = await EntertainmentItem.findOne({ 'metadata.externalId': 'tmdb_movie_777' });
            expect(dbItem).toBeDefined();
            expect(dbItem.title).toBe('Interstellar');
        });

        it('should fetch a non-existing track from Last.fm, save it to the DB, and return it', async () => {
            // Setup Last.fm mock output
            lastFmService.mockResolvedValue({
                title: 'Blinding Lights',
                releaseYear: 2020,
                image: 'blinding_lights.jpg',
                description: 'Synth-pop track',
                apiRating: 9.0,
                extra: { artist: 'The Weeknd' }
            });

            const res = await request(app)
                .get('/api/items/tracks/lastfm_track_888');

            expect(res.status).toBe(200);
            expect(lastFmService).toHaveBeenCalledWith('lastfm_track_888');
            expect(res.body.item.title).toBe('Blinding Lights');
            expect(res.body.item.metadata.artist).toBe('The Weeknd');

            // Verify it was persisted to DB
            const dbItem = await EntertainmentItem.findOne({ 'metadata.externalId': 'lastfm_track_888' });
            expect(dbItem).toBeDefined();
        });
    });

    describe('5. Google Books Proxy Endpoints', () => {
        it('should proxy search queries to Google Books API via BookService', async () => {
            const mockBooks = [
                { id: '1', title: 'JavaScript The Good Parts' },
                { id: '2', title: 'Eloquent JavaScript' }
            ];
            BookService.searchBooks.mockResolvedValue(mockBooks);

            const res = await request(app)
                .get('/api/googlebooks?q=javascript&maxResults=5');

            expect(res.status).toBe(200);
            expect(BookService.searchBooks).toHaveBeenCalledWith('javascript', 5);
            expect(res.body).toEqual(mockBooks);
        });

        it('should proxy single volume lookup to Google Books API via BookService', async () => {
            const mockBookDetails = {
                id: 'book_999',
                title: 'Design Patterns'
            };
            BookService.fetchVolumeById.mockResolvedValue(mockBookDetails);

            const res = await request(app)
                .get('/api/googlebooks/volume/book_999');

            expect(res.status).toBe(200);
            expect(BookService.fetchVolumeById).toHaveBeenCalledWith('book_999');
            expect(res.body).toEqual(mockBookDetails);
        });
    });

    describe('6. Logout Endpoint', () => {
        it('should log out the user and clear the session cookie', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', sessionCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Accessing /me now should result in 401
            const meRes = await request(app)
                .get('/api/auth/me')
                .set('Cookie', sessionCookie);

            expect(meRes.status).toBe(401);
            expect(meRes.body.success).toBe(false);
        });
    });
});
