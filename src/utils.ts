import { readFile } from "node:fs/promises";

export type GHPRConfigType = {
    users: {
        name: string;
        repo?: string;
        'repo-regexp'?: string;
    }[];
};

export async function parseJsonFile(filePath: string): Promise<GHPRConfigType> {

    try {
        const rawData = await readFile(filePath, { encoding: 'utf8' });
        return JSON.parse(rawData) as GHPRConfigType;
    } catch (err) {
        console.error('failed to parse config file: ' + err);
        throw err;
    }
}
