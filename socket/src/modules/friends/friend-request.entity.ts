import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('friend_requests')
export class FriendRequest {
    @PrimaryColumn('uuid')
    id!: string;

    @Column('uuid')
    sender_id!: string;

    @Column('uuid')
    receiver_id!: string;

    @Column({ nullable: true })
    sender_username!: string;

    @Column({ nullable: true })
    sender_avatar!: string;

    @Column({ nullable: true })
    sender_country!: string;

    @Column({ nullable: true })
    sender_country_code!: string;

    @Column({ nullable: true })
    receiver_username!: string;

    @Column({ nullable: true })
    receiver_avatar!: string;

    @Column({ nullable: true })
    receiver_country!: string;

    @Column({ nullable: true })
    receiver_country_code!: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    })
    status!: 'pending' | 'accepted' | 'declined';

    @Column({ type: 'bigint' })
    created_at!: number;
}
