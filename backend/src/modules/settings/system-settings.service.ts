import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SystemSettings } from '@database/entities/system-settings.entity';
import {
  CreateSystemSettingsDto,
  UpdateSystemSettingsDto,
} from '@common/dto/system-settings.dto';

/**
 * Keys the unauthenticated `GET /system/settings` may expose.
 *
 * Everything else — `mfaRequired`, `sessionTimeout`, and any key an operator
 * adds later — stays behind auth. The endpoint previously returned the entire
 * table to anonymous callers.
 */
export const PUBLIC_SETTING_KEYS = [
  'appName',
  'appEmail',
  'supportUrl',
  'logoUrl',
  'primaryColor',
] as const;

/** Keys that may be written at all. Bulk upsert used to accept anything. */
export const WRITABLE_SETTING_KEYS = [
  ...PUBLIC_SETTING_KEYS,
  'sessionTimeout',
  'mfaRequired',
  'notif_user_registration',
] as const;

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly settings: Repository<SystemSettings>,
  ) {}

  async create(dto: CreateSystemSettingsDto): Promise<SystemSettings> {
    this.assertWritable([dto.key]);
    return this.settings.save(this.settings.create(dto));
  }

  async findAll(): Promise<SystemSettings[]> {
    return this.settings.find();
  }

  async findPublic(): Promise<SystemSettings[]> {
    return this.settings.find({
      where: { key: In([...PUBLIC_SETTING_KEYS]) },
    });
  }

  async findByKey(key: string): Promise<SystemSettings> {
    const setting = await this.settings.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async update(key: string, dto: UpdateSystemSettingsDto): Promise<SystemSettings> {
    const setting = await this.findByKey(key);

    // Explicit assignment rather than Object.assign, which allowed `id` and
    // `key` to be overwritten from the request body.
    if (dto.value !== undefined) setting.value = dto.value;
    if (dto.group !== undefined) setting.group = dto.group;
    if (dto.description !== undefined) setting.description = dto.description;

    return this.settings.save(setting);
  }

  /** Batched upsert; the previous implementation issued 2 queries per key. */
  async upsertBulk(data: Record<string, string>): Promise<Record<string, string>> {
    const keys = Object.keys(data);
    if (!keys.length) return this.toMap(await this.findAll());

    this.assertWritable(keys);

    const existing = await this.settings.find({ where: { key: In(keys) } });
    const byKey = new Map(existing.map((s) => [s.key, s]));

    const rows = keys.map((key) => {
      const row = byKey.get(key) ?? this.settings.create({ key, group: 'general' });
      row.value = String(data[key]);
      return row;
    });

    await this.settings.save(rows);
    return this.toMap(await this.findAll());
  }

  async getValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const setting = await this.settings.findOne({ where: { key } });
    return setting?.value ?? defaultValue;
  }

  toMap(settings: SystemSettings[]): Record<string, string> {
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  private assertWritable(keys: string[]) {
    const rejected = keys.filter(
      (key) => !WRITABLE_SETTING_KEYS.includes(key as never),
    );
    if (rejected.length) {
      throw new BadRequestException(`Unknown setting key(s): ${rejected.join(', ')}`);
    }
  }
}
