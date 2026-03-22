/** Status module — in-memory active user set */

const activeUsers = new Set<string>();

export const presenceStore = {
    add(socketId: string): void { activeUsers.add(socketId); },
    remove(socketId: string): void { activeUsers.delete(socketId); },
    count(): number { return activeUsers.size; },
    getAll(): string[] { return Array.from(activeUsers); },
};
