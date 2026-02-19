
import { CONSTANTS } from './matchmaking.constants';

const lastPartnerMap = new Map<string, string>(); // userId -> partnerUserId
const lastPartnerTimeouts = new Map<string, NodeJS.Timeout>(); // userId -> timeout

const clearCooldown = (userId: string) => {
    lastPartnerMap.delete(userId);
    const timeout = lastPartnerTimeouts.get(userId);
    if (timeout) {
        clearTimeout(timeout);
        lastPartnerTimeouts.delete(userId);
    }
};

export const setMatchCooldown = (userAId: string, userBId: string) => {
    lastPartnerMap.set(userAId, userBId);
    lastPartnerMap.set(userBId, userAId);

    // Clear existing timeouts
    [userAId, userBId].forEach(uid => {
        if (lastPartnerTimeouts.has(uid)) {
            clearTimeout(lastPartnerTimeouts.get(uid)!);
            lastPartnerTimeouts.delete(uid);
        }
    });

    // Set new timeout
    const timeout = setTimeout(() => {
        if (lastPartnerMap.get(userAId) === userBId) clearCooldown(userAId);
        if (lastPartnerMap.get(userBId) === userAId) clearCooldown(userBId);
    }, CONSTANTS.COOLDOWN_MS);

    lastPartnerTimeouts.set(userAId, timeout);
    lastPartnerTimeouts.set(userBId, timeout);
};

export const checkCooldown = (userAId: string, userBId: string) => {
    const lastA = lastPartnerMap.get(userAId);
    const lastB = lastPartnerMap.get(userBId);
    return lastA === userBId || lastB === userAId;
};
