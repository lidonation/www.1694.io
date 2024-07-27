import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  retries: 2,
  defaultCommandTimeout: 20000,
  watchForFileChanges: false,
  video: true,
  screenshots: false,
  videosFolder: 'frontend/cypress/videos',
  screenshotsFolder: 'frontend/cypress/screenshots',
  fixturesFolder: 'frontend/cypress/fixture',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    env: {
      backendUrl: 'https://sancho.1694.io/api',
    }
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    
  },
});
