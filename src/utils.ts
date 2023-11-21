import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

interface GHPRConfig {
    users: {
        name: string;
        repo?: string;
        'repo-regexp'?: string;
    }[];
}

export class GHPRConfigManager {
    private config: GHPRConfig;

    constructor(configFile?: string, username?: string, repo?: string, repoRegexp?: string) {

        if (configFile !== undefined) {
            this.config = this.loadConfig(configFile);
        } else if (username !== undefined) {
            this.config = {
                users: [{
                    name: username,
                    repo: repo,
                    "repo-regexp": repoRegexp,
                }],
            };
        } else {
            throw new Error("config file or username must be specified");
        }

        console.log('ConfigManager: ' + JSON.stringify(this.config));
    }

    private loadConfig(filePath: string): GHPRConfig {
        const rawData = readFileSync(filePath, { encoding: 'utf8' });
        return JSON.parse(rawData) as GHPRConfig;
    }

    public getUsers(): string[] {
        return this.config.users.map((user) => user.name);
    }

    public getRepo(user: string): string | undefined {
        const userConfig = this.config.users.find((u) => u.name === user);
        if (userConfig === undefined) {
            return undefined;
        }

        return userConfig.repo;
    }

    public getRepoRegexp(user: string): string | undefined {
        const userConfig = this.config.users.find((u) => u.name === user);
        if (userConfig === undefined) {
            return undefined;
        }

        return userConfig['repo-regexp'];
    }
}
