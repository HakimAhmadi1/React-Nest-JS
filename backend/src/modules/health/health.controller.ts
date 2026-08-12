import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Liveness: no dependencies, so a database blip never causes the
   * orchestrator to kill an otherwise healthy container. Used by the
   * Dockerfile HEALTHCHECK.
   */
  @Get('live')
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      // Terminus needs the DataSource itself; the previous code passed the
      // connection *name* as a string, so this check never actually ran.
      () => this.db.pingCheck('database', { connection: this.dataSource }),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get()
  @HealthCheck()
  check() {
    return this.ready();
  }
}
