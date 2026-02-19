
import { Server } from 'socket.io';
import { User } from '../../shared/types/socket.types';
import {
    voiceQueue,
    voiceBuckets,
    getConnectedUser
} from '../../socket/users';
import { userService } from '../user/user.service';
import { QueueManager, notifyQueuePositions } from './matchmaking.queue';
import { checkCooldown } from './matchmaking.cooldowns';
import { initiateHandshake } from './matchmaking.rooms';

let isScanning = false;
let needsRescan = false;

const areUsersCompatible = (userA: User, userB: User) => {
    // Only users in FINDING state can be matched
    if (userA.state !== 'FINDING' || userB.state !== 'FINDING') return false;
    // Cannot match with self
    if (userA.id === userB.id) return false;
    // Cannot match if same person
    if (userA.userId === userB.userId) return false;

    // Last Partner Cooldown (userId based)
    if (checkCooldown(userA.userId, userB.userId)) return false;

    // Country Preferences
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    const bSatisfied = !userB.preferredCountry || userB.preferredCountry === userA.countryCode;

    return aSatisfied && bSatisfied;
};

export const scanQueueForMatches = (io: Server) => {
    if (isScanning) {
        needsRescan = true;
        return;
    }

    isScanning = true;

    try {
        if (voiceQueue.length < 2) return;

        const matchedInThisPass = new Set<string>();

        // 1. COLLECT AND VALIDATE ELIGIBLE USERS
        const eligibleUsers = voiceQueue.filter(u =>
            u.state === 'FINDING' &&
            io.sockets.sockets.has(u.id) &&
            userService.getSocketId(u.userId) === u.id
        );

        // 2. ITERATE BY JOIN ORDER (FIFO)
        for (let i = 0; i < eligibleUsers.length; i++) {
            const userA = eligibleUsers[i];
            if (matchedInThisPass.has(userA.id)) continue;

            let partner: User | undefined;

            // TRY PREFERENCE MATCH FIRST
            if (userA.preferredCountry) {
                const targetBucket = voiceBuckets.get(userA.preferredCountry);
                if (targetBucket) {
                    partner = targetBucket.find(userB =>
                        !matchedInThisPass.has(userB.id) &&
                        userB.id !== userA.id &&
                        userB.state === 'FINDING' &&
                        userService.getSocketId(userB.userId) === userB.id &&
                        areUsersCompatible(userA, userB)
                    );
                }
            }

            // TRY GENERAL MATCH
            if (!partner) {
                for (let j = 0; j < eligibleUsers.length; j++) {
                    const userB = eligibleUsers[j];
                    if (userB.id === userA.id || matchedInThisPass.has(userB.id)) continue;

                    if (areUsersCompatible(userA, userB)) {
                        partner = userB;
                        break;
                    }
                }
            }

            if (partner) {
                matchedInThisPass.add(userA.id);
                matchedInThisPass.add(partner.id);

                QueueManager.remove(userA.id);
                QueueManager.remove(partner.id);

                // circular ref hack: pass self as callback for failures inside initiation
                initiateHandshake(io, userA, partner, scanQueueForMatches);
            }
        }

        if (matchedInThisPass.size > 0) {
            notifyQueuePositions(io);
        }
    } finally {
        isScanning = false;
        if (needsRescan) {
            needsRescan = false;
            setTimeout(() => scanQueueForMatches(io), 100);
        }
    }
};
