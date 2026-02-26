import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('friends')
export class Friend {
    @PrimaryColumn('uuid')
    id!: string;

    @Column('uuid')
    user_id!: string;

    @Column('uuid')
    friend_id!: string;

    @Column({ nullable: true })
    friend_username!: string;

    @Column({ nullable: true })
    friend_avatar!: string;

    @Column({ nullable: true })
    friend_country!: string;

    @Column({ nullable: true })
    friend_country_code!: string;

    @Column({ type: 'bigint' })
    created_at!: number;
}
