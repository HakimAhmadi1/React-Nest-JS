import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { UserRole } from '../../common/constants/roles.config';

/**
 * Baseline schema.
 *
 * Written with the schema-builder API rather than raw SQL so TypeORM emits the
 * dialect-correct DDL (defaults, precision, enum rendering) itself.
 *
 * If you are migrating an existing database that was previously managed by
 * `synchronize: true`, do not run this against it — either drop and recreate,
 * or mark it as already applied:
 *   INSERT INTO migrations (timestamp, name)
 *   VALUES (1755000000000, 'InitSchema1755000000000');
 */
export class InitSchema1755000000000 implements MigrationInterface {
  name = 'InitSchema1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'email', type: 'varchar', length: '255', isNullable: false },
          {
            name: 'role',
            type: 'enum',
            enum: Object.values(UserRole),
            default: `'${UserRole.SUBSCRIBER}'`,
            isNullable: false,
          },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          {
            name: 'reset_password_token',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          { name: 'reset_password_expires', type: 'timestamp', isNullable: true },
          { name: 'avatar', type: 'varchar', length: '500', isNullable: true },
          { name: 'address', type: 'varchar', length: '255', isNullable: true },
          { name: 'city', type: 'varchar', length: '100', isNullable: true },
          { name: 'zip_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'country', type: 'varchar', length: '100', isNullable: true },
          { name: 'is_active', type: 'tinyint', default: 1, isNullable: false },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            precision: 6,
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            precision: 6,
            isNullable: false,
          },
          { name: 'deleted_at', type: 'timestamp', precision: 6, isNullable: true },
        ],
      }),
      true,
    );

    // Uniqueness enforced by the database, not only by an app-level check.
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_user_code',
        columnNames: ['user_code'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id', type: 'int', isNullable: false },
          { name: 'token_hash', type: 'char', length: '64', isNullable: false },
          { name: 'family_id', type: 'char', length: '36', isNullable: false },
          { name: 'expires_at', type: 'timestamp', precision: 6, isNullable: false },
          { name: 'revoked_at', type: 'timestamp', precision: 6, isNullable: true },
          { name: 'replaced_by', type: 'char', length: '64', isNullable: true },
          { name: 'user_agent', type: 'varchar', length: '255', isNullable: true },
          { name: 'ip', type: 'varchar', length: '45', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            precision: 6,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_token_hash',
        columnNames: ['token_hash'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({ name: 'IDX_refresh_tokens_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_family_id',
        columnNames: ['family_id'],
      }),
    );

    // Deleting a user must not strand their sessions.
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        name: 'FK_refresh_tokens_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id', type: 'int', isNullable: true },
          { name: 'user_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'action', type: 'varchar', length: '100', isNullable: false },
          { name: 'module', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          { name: 'user_agent', type: 'varchar', length: '255', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            precision: 6,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({ name: 'IDX_audit_logs_user_id', columnNames: ['user_id'] }),
    );
    // Every listing orders by created_at DESC.
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          { name: 'value', type: 'text', isNullable: false },
          {
            name: 'group',
            type: 'varchar',
            length: '50',
            default: "'general'",
            isNullable: false,
          },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            precision: 6,
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_settings', true);
    await queryRunner.dropForeignKey('refresh_tokens', 'FK_refresh_tokens_user');
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('refresh_tokens', true);
    await queryRunner.dropTable('users', true);
  }
}
