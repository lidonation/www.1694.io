import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  retries: 1,
  defaultCommandTimeout: 2000,
  watchForFileChanges: false,
  video: true,
  screenshotOnRunFailure: true,
  videosFolder: './cypress/videos',
  screenshotsFolder: './cypress/screenshots',
  fixturesFolder: './cypress/fixture',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://frontend:3000',
    env: {
      // Compose-internal, to match baseUrl above. The backend mounts its
      // controllers at the root, so there is no /api prefix.
      //
      // The suite does not pass on this alone: cy.intercept matches the URL the
      // browser actually requests, which is NEXT_PUBLIC_BASE_URL_API from the
      // build under test. Whoever re-enables the Cypress job in .gitlab-ci.yml
      // has to line these two up.
      backendUrl: 'http://backend:8000',
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
