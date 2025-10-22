import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'src/support/e2e.ts',
    fixturesFolder: 'src/fixtures',
    screenshotsFolder: 'dist/screenshots',
    videosFolder: 'dist/videos',
    baseUrl: 'http://127.0.0.1:3000',
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    env: {
      // Add any environment variables here
    },
    // Development server configuration
    experimentalStudio: true,
    video: false,
    screenshotOnRunFailure: true,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
