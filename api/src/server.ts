import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import app from './app';
import { initDatabase } from './core/config/database.config';

async function startServer() {
    try {
        await initDatabase();

        const { userService } = await import('./modules/user/user.service');
        userService.cleanupGhostUsers(7);
        setInterval(() => userService.cleanupGhostUsers(7), 24 * 60 * 60 * 1000);

        const server = http.createServer(app);
        const PORT = process.env.PORT || 3001;
        server.listen(PORT);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('Unhandled server error:', err);
    process.exit(1);
});
