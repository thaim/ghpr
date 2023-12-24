const { Command } = require("commander");

import { GHPRConfigManager } from "./config";
import { GitHubAPI, RepositoryPullRequests } from "./github";

const program = new Command();

program
    .name("ghpr")
    .version("0.1.0")
    .option("-u, --user <username>")
    .option("-r, --repo <repository name>")
    .option("--repo-regexp <repository regexp>")
    .option("-c, --config <config file>")
    .option("-f --format <format>", "text");

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repoString: string, repoRegexp: string, configFile: string, format: string) => {
    const github = new GitHubAPI(process.env.PAT);
    const configManager: GHPRConfigManager = new GHPRConfigManager(configFile, user, repoString, repoRegexp);

    for (const query of configManager.getQueries()) {
        if (query.repo !== undefined) {
            const prs: RepositoryPullRequests = await github.describeRepository(query.user, query.repo, query);
            if (prs.pullRequests.length === 0) {
                continue;
            }

            printRepo(query.user, query.repo, prs, format);
        } else if (query["repo-regexp"] !== undefined) {
            const repos = await github.getAllRepos(query.user, query["repo-regexp"], query.forked);
            for (const repo of repos) {
                const prs: RepositoryPullRequests = await github.describeRepository(query.user, repo, query);
                if (prs.pullRequests.length === 0) {
                    continue;
                }

                printRepo(query.user, repo, prs, format);
            }
        }
    }
};

function printRepo(user: string, repository: string, prs: RepositoryPullRequests, format: string) {
    switch (format) {
        case "json":
            console.log(JSON.stringify(prs));
            break;
        case "text":
        default:
            console.log(`${user}/${repository}`);
            for (const pr of prs.pullRequests) {
                console.log(`  "${pr.title}": ${pr.html_url} by ${pr.author} (${pr.updated_at}))`);
            }
            break;
    }
}

main(options.user, options.repo, options.repoRegexp, options.config, options.format);
