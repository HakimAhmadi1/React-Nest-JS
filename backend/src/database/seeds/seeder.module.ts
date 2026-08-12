import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { validateEnv } from '@common/config/env.validation';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    DatabaseModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
