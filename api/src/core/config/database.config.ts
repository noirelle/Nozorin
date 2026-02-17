import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, '../../modules/**/*.entity.{ts,js}')],
    migrations: [],
    subscribers: [],
});

export const initDatabase = async () => {
    const options = AppDataSource.options as any;
    console.log('----------------------------');
    console.log('[DB] Starting database initialization...');
    console.log(`[DB] Configured host: ${options.host}`);
    console.log(`[DB] Database: ${options.database}`);
    console.log(`[DB] Entities path: ${options.entities}`);
    console.log(`[DB] Migrations path: ${options.migrations}`);
    console.log(`[DB] Subscribers path: ${options.subscribers}`);
    console.log('----------------------------');

    try {
        await AppDataSource.initialize();
        console.log('[DB] Database connection established successfully!');
        console.log(`[DB] Connection options: ${JSON.stringify({
            host: options.host,
            port: options.port,
            username: options.username,
            database: options.database,
            synchronize: options.synchronize,
        })}`);
        console.log('----------------------------');
    } catch (error) {
        console.error('[DB] Error during Data Source initialization:', error);
        console.log('----------------------------');
        throw error;
    }
};
