
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import friendRoutes from './modules/friend/friend.routes';
import cookieParser from 'cookie-parser';
import matchmakingRoutes from './modules/matchmaking/matchmaking.routes';
import sessionRoutes from './modules/session/session.routes';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/session', sessionRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.send('Video & Chat API is running');
});

export default app;
