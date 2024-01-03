import { readFileSync } from "node:fs";

export interface GHPRConfig {
    queries: {
        user: string;
        repo?: string;
        "repo-regexp"?: string;
        forked?: boolean;
        author?: [string];
        "author-ignore"?: [string];
        draft?: boolean;
        reviewers?: [string];
        involves?: [string];
        since?: string;
        label?: [string];
    }[];
}

export class GHPRConfigManager {
    private config: GHPRConfig;
    private since?: string;

    constructor(configFile?: string, username?: string, repo?: string, repoRegexp?: string, since?: string) {
        this.since = since;
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
        this.config.queries.forEach((query) => {
            if (query.since === undefined) {
                query.since = this.since;
            }
        });

        return this.config.queries;
    }
}
