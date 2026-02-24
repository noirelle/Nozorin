import { DataSource } from 'typeorm';
import * as mysql2 from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mysql',
    driver: mysql2,
    host: process.env.MYSQLHOST!,
    port: parseInt(process.env.MYSQLPORT!),
    username: process.env.MYSQLUSER!,
    password: process.env.MYSQLPASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    synchronize: true, // Only for development
    logging: false,
    entities: [path.join(__dirname, '../../modules/**/*.entity.{ts,js}')],
    migrations: [],
    subscribers: [],
});

export const initDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log('[DB] Database connection established successfully in Socket service');
    } catch (error) {
        console.error('[DB] Error during Data Source initialization in Socket service:', error);
        throw error;
    }
};
