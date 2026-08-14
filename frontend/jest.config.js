module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // ESM-only asm.js bundle that Jest's CJS resolver cannot load; see the mock.
    '^@emurgo/cardano-serialization-lib-asmjs$':
      '<rootDir>/src/tests/__mocks__/cardanoSerializationLibMock.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg)$': '<rootDir>/src/tests/__mocks__/fileMock.ts', // Mock SVG files
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { configFile: './babel.config.jest.js' },
    ],
  },
};
