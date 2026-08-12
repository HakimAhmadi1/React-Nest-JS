import { Module } from '@nestjs/common';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  imports: [AuditLogModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SettingsModule {}
