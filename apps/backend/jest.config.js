module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.enum.ts',
    '!**/*.strategy.ts',
    '!**/*.interceptor.ts',
    '!common/filters/**',
    '!main.ts',
    '!database/**',
    '!migrations/**',
    '!scripts/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 50,
      lines: 65,
      statements: 65,
    },
  },
};
