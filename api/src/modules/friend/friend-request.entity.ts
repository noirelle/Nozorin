import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('friend_requests')
export class FriendRequest {
    @PrimaryColumn('uuid')
    id!: string;

    @Column('uuid')
    senderId!: string;

    @Column('uuid')
    receiverId!: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    })
    status!: 'pending' | 'accepted' | 'declined';

    @Column({ type: 'bigint' })
    created_at!: number;
}
