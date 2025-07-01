// jest.config.ts
import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

    roots: ["<rootDir>/src", "<rootDir>/tests"],

    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },

    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },

    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/src/config/"
    ],

    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
        "**/*.test.ts",
    ],

    verbose: true,
};

export default config;
