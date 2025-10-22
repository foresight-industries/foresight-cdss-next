import type { Config } from 'jest';

export default async (): Promise<Config> => ({
  projects: [
    {
      displayName: '@foresight-cdss-next/web',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      coverageDirectory: '../../coverage/apps/web',
      testEnvironment: 'jsdom',
    },
  ],
});
