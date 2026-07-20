const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 30000, // MongoDB Memory Server might take a few seconds to boot up
  },
});
