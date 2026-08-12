import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Not, Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@common/constants/roles.config';
import { hashPassword } from '@common/helpers/password.helper';
import { AdminCreateUserDto, AdminUpdateUserDto } from '@common/dto/users.dto';
import { PayloadDto } from '@common/dto/payload.dto';
import { TokenService } from '@modules/auth/token.service';

/** Fields an admin may write. Anything else is ignored, by construction. */
const MUTABLE_FIELDS = [
  'name',
  'email',
  'role',
  'isActive',
  'avatar',
  'address',
  'city',
  'zipCode',
  'country',
] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
  ) {}

  async create(dto: AdminCreateUserDto, actor: PayloadDto): Promise<User> {
    this.assertMayAssignRole(dto.role, actor);

    const existing = await this.users.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // `userCode` is derived from the primary key inside a transaction. The
    // previous count()-based schemes (here and in a TypeORM subscriber)
    // produced two different formats and both raced under concurrency.
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const user = await repo.save(
        repo.create({
          name: dto.name,
          email: dto.email,
          password: await hashPassword(dto.password),
          role: dto.role ?? UserRole.SUBSCRIBER,
          isActive: dto.isActive ?? true,
          avatar: dto.avatar,
          address: dto.address,
          city: dto.city,
          zipCode: dto.zipCode,
          country: dto.country,
        }),
      );

      user.userCode = `USR${String(user.id).padStart(6, '0')}`;
      await repo.update(user.id, { userCode: user.userCode });
      return user;
    });
  }

  async findAll(
    limit: number,
    offset: number,
    search?: string,
  ): Promise<[User[], number]> {
    // Soft-deleted rows are excluded automatically via @DeleteDateColumn.
    // `Like` (not `ILike`) — MySQL's default collation is already
    // case-insensitive, and ILIKE is Postgres-only syntax.
    const term = search?.trim();
    return this.users.findAndCount({
      where: term
        ? [
            { name: Like(`%${term}%`) },
            { email: Like(`%${term}%`) },
            { userCode: Like(`%${term}%`) },
          ]
        : {},
      order: { id: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, dto: AdminUpdateUserDto, actor: PayloadDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.role !== undefined) {
      this.assertMayAssignRole(dto.role, actor);
      if (user.id === actor.userId && dto.role !== user.role) {
        throw new ForbiddenException('You cannot change your own role');
      }
    }

    if (dto.isActive === false && user.id === actor.userId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    if (dto.email && dto.email !== user.email) {
      const clash = await this.users.findOne({
        where: { email: dto.email, id: Not(id) },
        withDeleted: true,
      });
      if (clash) {
        throw new ConflictException('Email already exists');
      }
    }

    // Explicit allow-list instead of Object.assign(user, dto): the old version
    // let any writable DTO field through, including `role`.
    for (const field of MUTABLE_FIELDS) {
      const value = dto[field as keyof AdminUpdateUserDto];
      if (value !== undefined) {
        (user as unknown as Record<string, unknown>)[field] = value;
      }
    }

    if (dto.password) {
      user.password = await hashPassword(dto.password);
    }

    const saved = await this.users.save(user);

    // A disabled account must not keep renewing its access token.
    if (dto.isActive === false || dto.password) {
      await this.tokenService.revokeAllForUser(saved.id);
    }

    return saved;
  }

  async remove(id: number, actor: PayloadDto): Promise<void> {
    if (id === actor.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.findOne(id);
    await this.users.softDelete(user.id);
    await this.tokenService.revokeAllForUser(user.id);
  }

  async checkAvailability(email: string, excludeId?: number): Promise<boolean> {
    if (!email) {
      throw new BadRequestException('email query parameter is required');
    }

    const existing = await this.users.findOne({
      where:
        excludeId !== undefined && !Number.isNaN(excludeId)
          ? { email, id: Not(excludeId) }
          : { email },
      withDeleted: true,
    });

    return !existing;
  }

  async stats() {
    const [total, active, admins] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { isActive: true } }),
      this.users.count({ where: { role: UserRole.SUPER_ADMIN } }),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const recent = await this.users
      .createQueryBuilder('user')
      .where('user.created_at >= :since', { since })
      .getCount();

    return { total, active, inactive: total - active, admins, last30Days: recent };
  }

  /** Only a SUPER_ADMIN may mint another SUPER_ADMIN. */
  private assertMayAssignRole(role: UserRole | undefined, actor: PayloadDto) {
    if (role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a SUPER_ADMIN can assign that role');
    }
  }
}
