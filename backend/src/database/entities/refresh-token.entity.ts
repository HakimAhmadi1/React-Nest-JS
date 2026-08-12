import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * One row per issued refresh token.
 *
 * Only the SHA-256 of the token is stored, so a database leak does not hand
 * out usable sessions. `familyId` groups a login session's rotation chain:
 * presenting an already-revoked token means the chain was replayed, so the
 * whole family is revoked at once.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Index('IDX_refresh_tokens_user_id')
  @Column('int', { name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('IDX_refresh_tokens_token_hash', { unique: true })
  @Column('char', { name: 'token_hash', length: 64 })
  tokenHash: string;

  @Index('IDX_refresh_tokens_family_id')
  @Column('char', { name: 'family_id', length: 36 })
  familyId: string;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt: Date;

  @Column('timestamp', { name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @Column('char', { name: 'replaced_by', length: 64, nullable: true })
  replacedBy: string | null;

  @Column('varchar', { name: 'user_agent', length: 255, nullable: true })
  userAgent: string | null;

  @Column('varchar', { name: 'ip', length: 45, nullable: true })
  ip: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
