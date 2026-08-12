import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { AuditLog } from '@database/entities/audit-log.entity';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) {}

  async summary() {
    const [stats, recentUsers, recentActivity, signupsByDay] = await Promise.all([
      this.usersService.stats(),
      this.users.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
      }),
      this.auditLogs.find({ order: { createdAt: 'DESC' }, take: 10 }),
      this.signupsByDay(14),
    ]);

    return { stats, recentUsers, recentActivity, signupsByDay };
  }

  /** Daily registration counts for the last `days` days, zero-filled. */
  private async signupsByDay(days: number) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const rows = await this.users
      .createQueryBuilder('user')
      .select('DATE(user.created_at)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('user.created_at >= :since', { since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: string }>();

    const counts = new Map(
      rows.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        Number(row.count),
      ]),
    );

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) ?? 0 };
    });
  }
}
