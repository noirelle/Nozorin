
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.send('Video & Chat API is running');
});

export default app;
