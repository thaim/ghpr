const { Command } = require("commander");
import { Octokit } from "@octokit/core"
import { paginateRest } from "@octokit/plugin-paginate-rest";

import { parseJsonFile, GHPRConfig } from './utils';
import { MyOctokit, GitHubAPI } from './github';

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
    const pat = process.env.PAT;
    const MyOctokit = Octokit.plugin(paginateRest) as (new (...args: any[]) => MyOctokit);
    const octokit = new MyOctokit({
        auth: pat
    });
    const github = new GitHubAPI();

    let repos;
    let config = {} as GHPRConfig;
    if (configFile !== undefined) {
        console.log(`config file: ${configFile}`);
        try {
            config = await parseJsonFile(configFile);
            console.log(config);
        } catch (error) {
            console.error(error);
        }
        repos = "";
    } else if (repoString === undefined && repoRegexp != "") {
        repos = await github.getAllRepos(octokit, user, repoRegexp);

        console.log(`repos: ${repos}`);
    } else {
        repos = repoString.split(",");
    }

    if (config !== undefined) {
        for (const user of config.users) {
            if (user.repo !== undefined) {
                await github.describeRepository(octokit, user.name, user.repo);
            } else if (user['repo-regexp'] !== undefined) {
                repos = await github.getAllRepos(octokit, user.name, user['repo-regexp']);
                for (const repo of repos) {
                    await github.describeRepository(octokit, user.name, repo);
                }
            }
        }
    } else {
        for (const repo of repos) {
            await github.describeRepository(octokit, user, repo);
        }
    }
}


main(options.user, options.repo, options.repoRegexp, options.config);
