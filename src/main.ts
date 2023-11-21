const { Command } = require("commander");

import { GHPRConfigManager } from './utils';
import { GitHubAPI } from './github';

const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')
    .option('-u, --user <username>')
    .option('-r, --repo <repository name>')
    .option('--repo-regexp <repository regexp>')
    .option('-c, --config <config file>');

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repoString: string, repoRegexp: string, configFile: string) => {
    const github = new GitHubAPI(process.env.PAT);
    const configManager: GHPRConfigManager = new GHPRConfigManager(configFile, user, repoString, repoRegexp);

    for (const user of configManager.getUsers()) {
        const repo = configManager.getRepo(user)
        const repoRegexp = configManager.getRepoRegexp(user);

        if (repo !== undefined) {
            await github.describeRepository(user, repo);
        } else if (repoRegexp !== undefined) {
            const repos = await github.getAllRepos(user, repoRegexp);
            for (const repo of repos) {
                await github.describeRepository(user, repo);
            }
        }
    }
}


main(options.user, options.repo, options.repoRegexp, options.config);
