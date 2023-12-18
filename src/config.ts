import { readFileSync } from "node:fs";

export interface GHPRConfig {
    queries: {
        user: string;
        repo?: string;
        "repo-regexp"?: string;
        author?: [string];
        "author-ignore"?: [string];
        draft?: boolean;
        reviewers?: [string];
        involves?: [string];
    }[];
}

export class GHPRConfigManager {
    private config: GHPRConfig;

    constructor(configFile?: string, username?: string, repo?: string, repoRegexp?: string) {
        if (configFile !== undefined) {
            this.config = this.loadConfig(configFile);
        } else if (username !== undefined) {
            this.config = {
                queries: [
                    {
                        user: username,
                        repo: repo,
                        "repo-regexp": repoRegexp,
                    },
                ],
            };
        } else {
            throw new Error("config file or username must be specified");
        }
    }

    private loadConfig(filePath: string): GHPRConfig {
        const rawData = readFileSync(filePath, { encoding: "utf8" });
        return JSON.parse(rawData) as GHPRConfig;
    }

    public getQueries(): GHPRConfig["queries"] {
        return this.config.queries;
    }
}
