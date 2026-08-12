import type { Config } from 'jest';

/**
 * Unit-test config.
 *
 * `moduleNameMapper` mirrors the `paths` table in tsconfig.json. It is spelled
 * out rather than derived via `pathsToModuleNameMapper`, because importing the
 * tsconfig JSON from an ESM-loaded config fails on Node 22+ without an import
 * attribute. Keep the two in sync when adding an alias.
 */
const config: Config = {
  rootDir: '.',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/seed.ts',
    '!src/database/migrations/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
