/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  testEnvironment: "jsdom",

  clearMocks: true,

  collectCoverage: true,

  coverageDirectory: "coverage",

  coverageProvider: "v8",

  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],

  transformIgnorePatterns: ["node_modules/(?!(@flipflag/sdk)/)"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@flipflag/sdk$": "<rootDir>/src/__mocks__/@flipflag/sdk.ts",
  },

  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default config;
