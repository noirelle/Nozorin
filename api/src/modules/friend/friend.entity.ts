import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('friends')
export class Friend {
    @PrimaryColumn('uuid')
    id!: string;

    @Column('uuid')
    userId!: string;

    @Column('uuid')
    friendId!: string;

    @Column({ type: 'bigint' })
    created_at!: number;
}
