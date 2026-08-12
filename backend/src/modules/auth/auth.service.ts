import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@common/constants/roles.config';
import { comparePassword, hashPassword } from '@common/helpers/password.helper';
import { RegisterDto } from '@common/dto/users.dto';
import { MailService } from '@modules/mail/mail.service';
import { TokenService } from './token.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Public self-registration. The role is hardcoded — `RegisterDto` has no
   * `role` field, and even if a client sends one the global whitelist pipe
   * rejects the request.
   */
  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.users.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.users.save(
      this.users.create({
        name: dto.name,
        email: dto.email,
        password: await hashPassword(dto.password),
        role: UserRole.SUBSCRIBER,
        isActive: true,
      }),
    );

    user.userCode = `USR${String(user.id).padStart(6, '0')}`;
    await this.users.update(user.id, { userCode: user.userCode });

    return user;
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.users.findOne({ where: { email } });

    // Same error and roughly the same work either way, so the response does
    // not reveal whether the address exists.
    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return user;
  }

  /**
   * Always resolves, whether or not the address exists — the previous version
   * threw "User not found", turning this into an account-enumeration oracle,
   * and returned the raw reset token in the HTTP response.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      this.logger.debug(`Password reset requested for unknown address`);
      return;
    }

    const resetToken = randomBytes(32).toString('hex');

    // Awaited: the previous code sent the email before the write landed.
    await this.users.update(user.id, {
      resetPasswordToken: sha256(resetToken),
      resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const appUrl = this.config.get<string>('APP_URL');
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    await this.mailService.send({
      to: user.email,
      subject: 'Password reset request',
      text: `Reset your password using this link: ${resetLink}\n\nThis link expires in one hour. If you did not request it, ignore this email.`,
      html: `<p>Reset your password by clicking the link below.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in one hour. If you did not request it, ignore this email.</p>`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.users.findOne({
      where: { resetPasswordToken: sha256(token) },
    });

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!this.constantTimeEquals(user.resetPasswordToken, sha256(token))) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Absent expiry is treated as expired, not as "never expires".
    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.users.update(user.id, {
      password: await hashPassword(newPassword),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    // A password reset ends every existing session.
    await this.tokenService.revokeAllForUser(user.id);

    return user;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await comparePassword(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.users.update(user.id, {
      password: await hashPassword(newPassword),
    });
    await this.tokenService.revokeAllForUser(user.id);
  }

  async findById(userId: number): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  }
}
