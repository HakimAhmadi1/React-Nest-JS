import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import * as entities from './entities';

export const dbEntities = Object.values(entities);

/**
 * Uses the DEFAULT connection. The previous named connection
 * (`indexPosAdminConnection`) had to be threaded through ~29 call sites and
 * bought nothing — there is exactly one database.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        ...dataSourceOptions,
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASS'),
        database: config.get<string>('DATABASE_NAME'),
        entities: dbEntities,
        autoLoadEntities: false,
      }),
    }),
    TypeOrmModule.forFeature(dbEntities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
