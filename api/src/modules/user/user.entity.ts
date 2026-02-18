import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    avatar!: string;

    @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
    gender!: string;

    @Column({ default: false })
    profile_completed!: boolean;

    @Column({ default: false })
    is_claimed!: boolean;

    @Column({ type: 'bigint' })
    created_at!: number;

    @Column({ nullable: true })
    country!: string;

    @Column({ nullable: true })
    city!: string;

    @Column({ nullable: true })
    region!: string;

    @Column({ type: 'float', nullable: true })
    lat!: number;

    @Column({ type: 'float', nullable: true })
    lon!: number;

    @Column({ nullable: true })
    timezone!: string;

    @Column({ nullable: true })
    last_ip?: string;

    @Column({ nullable: true })
    device_id?: string;

    @Column({ nullable: true })
    fingerprint?: string;

    @Column({ type: 'bigint', default: 0 })
    last_active_at!: number;
}
