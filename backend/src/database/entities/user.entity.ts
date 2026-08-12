import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@common/constants/roles.config';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Index('IDX_users_user_code', { unique: true })
  @Column('varchar', { name: 'user_code', length: 20, nullable: true })
  userCode: string;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  // Uniqueness belongs in the database, not only in an app-level availability check.
  @Index('IDX_users_email', { unique: true })
  @Column('varchar', { name: 'email', length: 255 })
  email: string;

  @Column('enum', {
    name: 'role',
    enum: UserRole,
    default: UserRole.SUBSCRIBER,
  })
  role: UserRole;

  @Exclude()
  @Column('varchar', { name: 'password', length: 255 })
  password: string;

  @Exclude()
  @Column('varchar', { name: 'reset_password_token', length: 64, nullable: true })
  resetPasswordToken: string | null;

  @Exclude()
  @Column('timestamp', { name: 'reset_password_expires', nullable: true })
  resetPasswordExpires: Date | null;

  @Column('varchar', { name: 'avatar', length: 500, nullable: true })
  avatar: string;

  @Column('varchar', { name: 'address', length: 255, nullable: true })
  address: string;

  @Column('varchar', { name: 'city', length: 100, nullable: true })
  city: string;

  @Column('varchar', { name: 'zip_code', length: 20, nullable: true })
  zipCode: string;

  @Column('varchar', { name: 'country', length: 100, nullable: true })
  country: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  /**
   * The only soft-delete mechanism. The old `is_deleted` boolean coexisted
   * with this column and half the queries checked the wrong one; TypeORM
   * excludes rows with `deleted_at` set from every `find` automatically.
   */
  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
