import { AppDataSource } from '../../core/config/database.config';
import { CallHistory } from './history.entity';

export const sessionService = {
    async getHistory(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        const records = await repository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' }
        });

        // Limit to latest 20 for the list, but use all for stats
        const history = records.slice(0, 20).map(record => ({
            sessionId: record.id,
            partnerId: record.partner_id,
            partnerUsername: record.partner_username,
            partnerCountry: record.partner_country,
            partnerCountryCode: record.partner_country_code,
            duration: record.duration,
            mode: record.mode,
            createdAt: record.created_at.getTime(),
            disconnectReason: record.reason
        }));

        const totalDuration = records.reduce((acc, curr) => acc + curr.duration, 0);
        const countriesConnected = [...new Set(records.map(r => r.partner_country).filter(c => !!c))];
        const averageDuration = records.length > 0 ? Math.floor(totalDuration / records.length) : 0;

        return {
            history,
            stats: {
                totalSessions: records.length,
                totalDuration,
                averageDuration,
                countriesConnected
            }
        };
    },

    async deleteHistory(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        await repository.delete({ user_id: userId });
    }
};
