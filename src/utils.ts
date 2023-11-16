import { readFile } from "node:fs/promises";

export async function parseJsonFile(filePath: string): Promise<string> {

    try {
        const rawData = await readFile(filePath, { encoding: 'utf8' });
        return JSON.parse(rawData);
    } catch (err) {
        console.error('failed to parse config file: ' + err);
        throw err;
    }
}
