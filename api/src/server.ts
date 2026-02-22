import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import app from './app';
import { initDatabase } from './core/config/database.config';

// Initialize Database
initDatabase()
    .then(() => {
        import('./modules/user/user.service').then(({ userService }) => {
            userService.cleanupGhostUsers(7);
            setInterval(() => userService.cleanupGhostUsers(7), 24 * 60 * 60 * 1000);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
    });

const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
