import { createDefaultPreset } from 'ts-jest';
import type { Config } from 'jest';

const tsJestTransformCfg = createDefaultPreset().transform;

export default async (): Promise<Config> => ({
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  projects: [
    {
      displayName: '@foresight-cdss-next/web',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      coverageDirectory: '../../coverage/apps/web',
      testEnvironment: 'jsdom',
    },
  ],
});
