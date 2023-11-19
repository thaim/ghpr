import { readFile } from "node:fs/promises";

export type GHPRConfig = {
    users: {
        name: string;
        repo?: string;
        'repo-regexp'?: string;
    }[];
};

export async function parseJsonFile(filePath: string): Promise<GHPRConfig> {

    try {
        const rawData = await readFile(filePath, { encoding: 'utf8' });
        return JSON.parse(rawData) as GHPRConfig;
    } catch (err) {
        console.error('failed to parse config file: ' + err);
        throw err;
    }
}
