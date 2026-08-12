import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { SystemSettings } from '@database/entities/system-settings.entity';
import { UserRole } from '@common/constants/roles.config';
import { hashPassword } from '@common/helpers/password.helper';

const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

/**
 * Idempotent data seeding. Schema is the migrations' job — this only inserts
 * rows that don't already exist, so it is safe to re-run.
 */
@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SystemSettings)
    private readonly settingsRepository: Repository<SystemSettings>,
    private readonly config: ConfigService,
  ) {}

  async seed() {
    this.logger.log('Starting database seeding...');
    await this.seedAdminUser();
    await this.seedDefaultSettings();
    this.logger.log('Database seeding completed.');
  }

  private async seedAdminUser() {
    const email = this.config.get<string>('SEED_ADMIN_EMAIL') ?? DEFAULT_ADMIN_EMAIL;
    const password =
      this.config.get<string>('SEED_ADMIN_PASSWORD') ?? DEFAULT_ADMIN_PASSWORD;

    // Refuse to create a well-known account with a well-known password in prod.
    if (
      this.config.get<string>('NODE_ENV') === 'production' &&
      password === DEFAULT_ADMIN_PASSWORD
    ) {
      throw new Error(
        'Refusing to seed the default admin password in production. Set SEED_ADMIN_PASSWORD.',
      );
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`Admin user ${email} already exists.`);
      return;
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        name: 'System Admin',
        email,
        password: await hashPassword(password),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      }),
    );

    await this.usersRepository.update(user.id, {
      userCode: `USR${String(user.id).padStart(6, '0')}`,
    });

    this.logger.log(`Created admin user ${email}.`);
  }

  private async seedDefaultSettings() {
    const defaults = [
      {
        key: 'appName',
        value: 'Generic Platform',
        group: 'general',
        description: 'Application display name',
      },
      {
        key: 'appEmail',
        value: 'admin@example.com',
        group: 'general',
        description: 'Application contact email',
      },
      {
        key: 'supportUrl',
        value: '/support',
        group: 'general',
        description: 'Support page URL',
      },
      {
        key: 'sessionTimeout',
        value: '60',
        group: 'security',
        description: 'Session timeout in minutes',
      },
      {
        key: 'mfaRequired',
        value: 'false',
        group: 'security',
        description: 'Require 2FA for all admins',
      },
      {
        key: 'notif_user_registration',
        value: 'true',
        group: 'notifications',
        description: 'Notify on user registration',
      },
    ];

    for (const setting of defaults) {
      const exists = await this.settingsRepository.findOne({
        where: { key: setting.key },
      });
      if (!exists) {
        await this.settingsRepository.save(this.settingsRepository.create(setting));
      }
    }

    this.logger.log('Default system settings seeded.');
  }
}
