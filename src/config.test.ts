import { expect, test } from "@jest/globals";
import { GHPRConfigManager } from "./config";

test("create config with user and repo argument", () => {
    const configManager = new GHPRConfigManager(undefined, "user", "repo", "repo-regexp");
    const queries = configManager.getQueries();

    expect(queries).toHaveLength(1);
});

test("create config with config file argument", () => {
    const configManager = new GHPRConfigManager("testData/example.json");
    const queries = configManager.getQueries();

    expect(queries).toHaveLength(3);
});
