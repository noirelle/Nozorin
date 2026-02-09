
interface Stats {
    peopleOnline: number;
    dailyChats: number;
    totalConnections: number;
}

class StatsService {
    private stats: Stats = {
        peopleOnline: 0,
        dailyChats: 0,
        totalConnections: 0, // Start from 0, real count only
    };

    private dailyChatCount = 0;
    private lastResetDate = new Date().toDateString();

    constructor() {
        // Reset daily chats at midnight
        setInterval(() => {
            const currentDate = new Date().toDateString();
            if (currentDate !== this.lastResetDate) {
                this.dailyChatCount = 0;
                this.stats.dailyChats = 0;
                this.lastResetDate = currentDate;
                console.log('[STATS] Daily chat count reset');
            }
        }, 60000); // Check every minute
    }

    incrementOnlineUsers() {
        this.stats.peopleOnline++;
        console.log(`[STATS] Online users: ${this.stats.peopleOnline}`);
    }

    decrementOnlineUsers() {
        if (this.stats.peopleOnline > 0) {
            this.stats.peopleOnline--;
        }
        console.log(`[STATS] Online users: ${this.stats.peopleOnline}`);
    }

    incrementDailyChats() {
        this.dailyChatCount++;
        this.stats.dailyChats = this.dailyChatCount; // Real count only
        console.log(`[STATS] Daily chats: ${this.stats.dailyChats}`);
    }

    incrementTotalConnections() {
        this.stats.totalConnections++;
        console.log(`[STATS] Total connections: ${this.stats.totalConnections}`);
    }

    getStats(): Stats {
        return { ...this.stats };
    }
}

export const statsService = new StatsService();
