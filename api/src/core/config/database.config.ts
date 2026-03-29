import { DataSource } from 'typeorm';
import * as mysql2 from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mysql',
    driver: mysql2,
    connectorPackage: 'mysql2',
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'db',
    port: parseInt(process.env.MYSQLPORT || '3306'),
    username: process.env.MYSQLUSER || 'nozorin',
    password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'nozorin_db',
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, '../../modules/**/*.entity.{ts,js}')],
    migrations: [],
    subscribers: [],
});

export const initDatabase = async (retries = 5, delay = 2000) => {
    while (retries > 0) {
        try {
            await AppDataSource.initialize();
            console.log('[DB] Database connection established successfully');
            return;
        } catch (error) {
            retries--;
            console.error(`[DB] Error during Data Source initialization (${retries} retries left):`, error instanceof Error ? error.message : error);
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
