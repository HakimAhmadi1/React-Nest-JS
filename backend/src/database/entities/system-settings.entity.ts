import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'key', unique: true, length: 100 })
  key: string;

  @Column('text', { name: 'value' })
  value: string;

  @Column('varchar', { name: 'group', length: 50, default: 'general' })
  group: string;

  @Column('varchar', { name: 'description', length: 255, nullable: true })
  description: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
