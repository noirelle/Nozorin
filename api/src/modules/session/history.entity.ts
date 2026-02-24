import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('call_history')
export class CallHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    user_id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ nullable: true })
    partner_id!: string;

    @Column({ nullable: true })
    partner_username!: string;

    @Column({ nullable: true })
    partner_avatar!: string;

    @Column({ nullable: true })
    partner_country!: string;

    @Column({ nullable: true })
    partner_country_code!: string;

    @Column({ type: 'int', default: 0 })
    duration!: number;

    @Column({ type: 'enum', enum: ['voice', 'chat'], default: 'voice' })
    mode!: string;

    @Column({ nullable: true })
    reason!: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;
}
