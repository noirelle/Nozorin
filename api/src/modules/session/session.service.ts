import { AppDataSource } from '../../core/config/database.config';
import { CallHistory } from './history.entity';
import { userService } from '../user/user.service';

export const sessionService = {
    async getHistory(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        const records = await repository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' }
        });

        // Fetch partner statuses
        const partnerIds = [...new Set(records.slice(0, 20).map(r => r.partner_id).filter(id => !!id))];
        const statuses = await userService.getUserStatuses(partnerIds);

        // Limit to latest 20 for the list, but use all for stats
        const history = records.slice(0, 20).map(record => ({
            session_id: record.id,
            partner_id: record.partner_id,
            partner_username: record.partner_username,
            partner_country_name: record.partner_country_name,
            partner_country: record.partner_country,
            partner_avatar: record.partner_avatar,
            duration: record.duration,
            mode: record.mode,
            created_at: record.created_at.getTime(),
            disconnect_reason: record.reason,
            partner_status: record.partner_id ? statuses[record.partner_id] : { is_online: false, last_seen: 0 }
        }));

        const total_duration = records.reduce((acc, curr) => acc + curr.duration, 0);
        const countries_connected = [...new Set(records.map(r => r.partner_country_name).filter(c => !!c))];
        const average_duration = records.length > 0 ? Math.floor(total_duration / records.length) : 0;

        return {
            history,
            stats: {
                total_sessions: records.length,
                total_duration,
                average_duration,
                countries_connected
            }
        };
    },

    async deleteHistory(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        await repository.delete({ user_id: userId });
    },

    async hasCallHistory(userId: string, partnerId: string): Promise<boolean> {
        const repository = AppDataSource.getRepository(CallHistory);
        const count = await repository.count({
            where: {
                user_id: userId,
                partner_id: partnerId
            }
        });
        return count > 0;
    }
};
